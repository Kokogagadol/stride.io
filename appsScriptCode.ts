/**
 * Ready-to-copy Google Apps Script code for Google Sheets Integration
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * PELACAK LARI ALA STRAVA - GOOGLE APPS SCRIPT WEB APP
 * Sinkronisasi Real-Time dengan Google Sheets
 * ====================================================================
 * 
 * CARA MEMASANG (HANYA 1 MENIT):
 * 1. Buka Google Sheets baru di browser Anda (sheets.new).
 * 2. Di menu atas, klik: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus semua kode default di Apps Script, lalu PASTE SELURUH KODE DI BAWAH INI.
 * 4. Klik ikon Disket (Simpan / Save).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > "Penerapan Baru" (New Deployment).
 * 6. Pada ikon Gear (Jenis pilihan), pilih "Aplikasi Web" (Web App).
 * 7. Atur konfigurasi:
 *    - Deskripsi: Strava Running Tracker API
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> [PENTING!]
 * 8. Klik "Terapkan" (Deploy), lalu izinkan izin akses Google jika diminta.
 * 9. Salin "URL Aplikasi Web" (akhiran /exec) dan tempelkan ke aplikasi web ini!
 */

const SHEET_NAME = "Running_Activities";

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000); // Tunggu hingga 10 detik jika ada operasi bersamaan

    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("Tidak ada data yang diterima.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Buat sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupSheetHeaders(sheet);
    } else if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
    }

    // Format data yang akan disimpan
    const timestamp = new Date();
    const id = data.id || Utilities.getUuid();
    const title = data.title || "Aktivitas Lari";
    const date = data.date ? new Date(data.date).toLocaleString("id-ID") : timestamp.toLocaleString("id-ID");
    const distanceKm = Number(data.distanceKm) || 0;
    const durationSeconds = Number(data.durationSeconds) || 0;
    const durationFormatted = data.durationFormatted || formatSeconds(durationSeconds);
    const paceFormatted = data.paceFormatted || "--'--\" /km";
    const paceSeconds = Number(data.paceSeconds) || 0;
    const calories = Number(data.calories) || 0;
    const type = data.type || "easy";
    const rpe = data.rpe ? Number(data.rpe) : 5;
    const notes = data.notes || "";

    // Tambahkan baris baru secara real-time
    sheet.appendRow([
      timestamp,
      id,
      title,
      date,
      distanceKm,
      durationSeconds,
      durationFormatted,
      paceFormatted,
      paceSeconds,
      calories,
      type,
      rpe,
      notes
    ]);

    // Beri format angka pada kolom jarak (km)
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 5).setNumberFormat("#,##0.00"); // Jarak km
    sheet.getRange(lastRow, 10).setNumberFormat("#,##0");   // Kalori

    lock.releaseLock();

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Aktivitas lari berhasil disimpan ke Google Sheets secara real-time!",
        id: id,
        savedRow: lastRow
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "getActivities";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (action === "ping" || action === "test") {
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          message: "Koneksi Google Apps Script & Google Sheets aktif!",
          sheetName: sheet ? sheet.getName() : "Belum dibuat (akan otomatis dibuat saat simpan pertama)",
          spreadsheetName: ss.getName()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          status: "success",
          activities: []
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const activities = rows.map(function(row) {
      return {
        id: String(row[1] || ""),
        title: String(row[2] || "Lari"),
        date: row[3] ? new Date(row[3]).toISOString() : new Date().toISOString(),
        distanceKm: Number(row[4]) || 0,
        durationSeconds: Number(row[5]) || 0,
        durationFormatted: String(row[6] || ""),
        paceFormatted: String(row[7] || ""),
        paceSeconds: Number(row[8]) || 0,
        calories: Number(row[9]) || 0,
        type: String(row[10] || "easy"),
        rpe: Number(row[11]) || 5,
        notes: String(row[12] || ""),
        syncedToSheets: true
      };
    });

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        activities: activities
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSheetHeaders(sheet) {
  const headers = [
    "Timestamp",
    "Activity ID",
    "Judul Aktivitas",
    "Tanggal & Waktu",
    "Jarak (km)",
    "Durasi (detik)",
    "Durasi Format",
    "Pace (/km)",
    "Pace Detik",
    "Kalori (kcal)",
    "Tipe Lari",
    "RPE (1-10)",
    "Catatan"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Styling Header ala Strava (Orange #FC5200)
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#FC5200");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function formatSeconds(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = function(n) { return n < 10 ? '0' + n : n; };
  if (hours > 0) {
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  }
  return pad(minutes) + ':' + pad(seconds);
}
`;
