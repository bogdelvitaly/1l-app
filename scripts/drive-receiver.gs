/**
 * Google Apps Script — lives in the backup Google account, NOT part of the Next.js build.
 * Receives the weekly backup from /api/cron/backup and saves it into the Drive
 * folder "1L-backups", keeping the newest KEEP_WEEKS backups.
 *
 * Setup (once, signed in to the backup account): script.google.com → New project →
 * paste this file → set SECRET below → Deploy → New deployment → type "Web app",
 * Execute as: Me, Who has access: Anyone → copy the Web app URL.
 * The same SECRET goes to Vercel as DRIVE_BACKUP_SECRET, the URL as DRIVE_BACKUP_URL.
 */
var SECRET = "PUT-A-LONG-RANDOM-STRING-HERE";
var FOLDER_NAME = "1L-backups";
var KEEP_WEEKS = 12;

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json_({ ok: false, error: "bad secret" });

    var folders = DriveApp.getFoldersByName(FOLDER_NAME);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);

    body.files.forEach(function (f) {
      // Re-running on the same day replaces that day's file instead of duplicating it.
      var same = folder.getFilesByName(f.name);
      while (same.hasNext()) same.next().setTrashed(true);
      var blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.mime, f.name);
      folder.createFile(blob);
    });

    // Keep the newest KEEP_WEEKS backups (2 files each: .xlsx + .json).
    var all = [];
    var it = folder.getFiles();
    while (it.hasNext()) all.push(it.next());
    all.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
    all.slice(KEEP_WEEKS * 2).forEach(function (f) { f.setTrashed(true); });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
