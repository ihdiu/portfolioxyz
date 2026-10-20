import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { upload } from '../src/middleware/upload.js';

describe('Upload Middleware File Filter', () => {
  const fileFilter = upload.fileFilter;

  test('allows JPEG, PNG, and WebP images', (t, done) => {
    const validFiles = [
      { fieldname: 'avatar', mimetype: 'image/jpeg', originalname: 'avatar.jpg' },
      { fieldname: 'cover_path', mimetype: 'image/png', originalname: 'circuit.png' },
      { fieldname: 'cover_path', mimetype: 'image/webp', originalname: 'board.webp' },
    ];

    let passed = 0;
    validFiles.forEach((file) => {
      fileFilter({}, file, (err, accept) => {
        assert.equal(err, null);
        assert.equal(accept, true);
        passed++;
        if (passed === validFiles.length) done();
      });
    });
  });

  test('allows PDF strictly for resume_file field', (t, done) => {
    const resumeFile = { fieldname: 'resume_file', mimetype: 'application/pdf', originalname: 'cv.pdf' };
    fileFilter({}, resumeFile, (err, accept) => {
      assert.equal(err, null);
      assert.equal(accept, true);

      // PDF for non-resume field should be rejected
      const invalidPdf = { fieldname: 'avatar', mimetype: 'application/pdf', originalname: 'cv.pdf' };
      fileFilter({}, invalidPdf, (err2, accept2) => {
        assert.ok(err2 instanceof Error);
        assert.equal(accept2, false);
        done();
      });
    });
  });

  test('rejects SVG files explicitly for security', (t, done) => {
    const svgFile = { fieldname: 'cover_path', mimetype: 'image/svg+xml', originalname: 'exploit.svg' };
    fileFilter({}, svgFile, (err, accept) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /SVG files are not permitted/);
      assert.equal(accept, false);
      done();
    });
  });

  test('rejects unauthorized MIME types', (t, done) => {
    const badFile = { fieldname: 'cover_path', mimetype: 'application/x-msdownload', originalname: 'malware.exe' };
    fileFilter({}, badFile, (err, accept) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /Invalid file type/);
      assert.equal(accept, false);
      done();
    });
  });
});
