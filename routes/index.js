// routes/index.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// 1) Koneksi ke database `db_barang`
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_barang'
});
db.connect(err => {
  if (err) throw err;
  console.log('Database terhubung (dari routes/index.js)');
});

// 2) Middleware untuk cek login
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Halaman utama: daftar semua produk
router.get('/', (req, res) => {
  const query = `
    SELECT p.id_produk, p.nama_produk, p.harga,
           k.nama_kategori, IFNULL(s.jumlah_stok,0) AS jumlah_stok
    FROM produk p
    JOIN kategori k ON p.id_kategori = k.id_kategori
    LEFT JOIN stok s ON p.id_produk = s.id_produk
  `;
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render('home', { products: results });
  });
});

// Halaman kategori
router.get('/kategori/:nama_kategori', (req, res) => {
  const { nama_kategori } = req.params;
  const query = `
    SELECT p.id_produk, p.nama_produk, p.harga,
           k.nama_kategori, IFNULL(s.jumlah_stok,0) AS jumlah_stok
    FROM produk p
    JOIN kategori k ON p.id_kategori = k.id_kategori
    LEFT JOIN stok s ON p.id_produk = s.id_produk
    WHERE k.nama_kategori = ?
  `;
  db.query(query, [nama_kategori], (err, results) => {
    if (err) throw err;
    res.render('kategori', { kategori: nama_kategori, data: results });
  });
});

// Halaman login (GET/POST)
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const queryLogin = 'SELECT * FROM user WHERE username = ? AND password = ?';
  db.query(queryLogin, [username, password], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      // Sekarang req.session pasti sudah terdefinisi karena app.js benar
      req.session.user = {
        id: results[0].id_user,
        username: results[0].username
      };
      return res.redirect('/admin');
    }
    res.render('login', { error: 'Username atau password salah!' });
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/login');
  });
});

// Dashboard admin (redirect ke daftar produk admin)
router.get('/admin', isAuthenticated, (req, res) => {
  res.redirect('/admin/produk');
});

// Daftar produk di area admin
router.get('/admin/produk', isAuthenticated, (req, res) => {
  const query = `
    SELECT p.id_produk, p.nama_produk, p.harga,
           k.nama_kategori, IFNULL(s.jumlah_stok,0) AS jumlah_stok
    FROM produk p
    JOIN kategori k ON p.id_kategori = k.id_kategori
    LEFT JOIN stok s ON p.id_produk = s.id_produk
  `;
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render('admin', { data: results });
  });
});

// Form tambah produk (GET) & proses tambah (POST)
router.get('/tambah', isAuthenticated, (req, res) => {
  db.query('SELECT * FROM kategori', (err, kategori) => {
    if (err) throw err;
    res.render('tambah', { kategori });
  });
});
router.post('/tambah', isAuthenticated, (req, res) => {
  const { nama_produk, harga, id_kategori, jumlah_stok } = req.body;
  const insertProduk = 'INSERT INTO produk (nama_produk, harga, id_kategori) VALUES (?, ?, ?)';
  db.query(insertProduk, [nama_produk, harga, id_kategori], (err, result) => {
    if (err) throw err;
    const id_produk = result.insertId;
    const insertStok = 'INSERT INTO stok (id_produk, jumlah_stok) VALUES (?, ?)';
    db.query(insertStok, [id_produk, jumlah_stok], (err) => {
      if (err) throw err;
      res.redirect('/admin');
    });
  });
});

// Form Edit Produk (GET)
router.get('/edit/:id_produk', isAuthenticated, (req, res) => {
  const { id_produk } = req.params;

  const getProdukQuery = `
    SELECT p.*, IFNULL(s.jumlah_stok, 0) AS jumlah_stok
    FROM produk p
    LEFT JOIN stok s ON p.id_produk = s.id_produk
    WHERE p.id_produk = ?
  `;
  const getKategoriQuery = 'SELECT * FROM kategori';

  db.query(getProdukQuery, [id_produk], (err, produkResult) => {
    if (err) {
      console.error('Error ambil data produk:', err);
      return res.status(500).send('Gagal ambil data produk');
    }

    if (produkResult.length === 0) {
      return res.status(404).send('Produk tidak ditemukan');
    }

    db.query(getKategoriQuery, (err, kategoriResult) => {
      if (err) {
        console.error('Error ambil data kategori:', err);
        return res.status(500).send('Gagal ambil data kategori');
      }

      res.render('edit', {
        produk: produkResult[0],
        kategori: kategoriResult
      });
    });
  });
});

// Proses Edit Produk (POST)
router.post('/edit/:id_produk', isAuthenticated, (req, res) => {
  const { id_produk } = req.params;
  const { nama_produk, harga, id_kategori, jumlah_stok } = req.body;

  console.log('Proses EDIT:', { id_produk, nama_produk, harga, id_kategori, jumlah_stok }); // Debug log

  // Pastikan semua data terisi
  if (!id_produk || !nama_produk || !harga || !id_kategori) {
    return res.status(400).send('Data tidak lengkap.');
  }

  // Update tabel produk
  const updateProdukQuery = `
    UPDATE produk 
    SET nama_produk = ?, harga = ?, id_kategori = ?
    WHERE id_produk = ?
  `;

  db.query(updateProdukQuery, [nama_produk, harga, id_kategori, id_produk], (err) => {
    if (err) {
      console.error('Gagal update produk:', err);
      return res.status(500).send('Gagal update produk');
    }

    // Update atau insert stok
    const upsertStokQuery = `
      INSERT INTO stok (id_produk, jumlah_stok)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE jumlah_stok = VALUES(jumlah_stok)
    `;

    db.query(upsertStokQuery, [id_produk, jumlah_stok], (err) => {
      if (err) {
        console.error('Gagal update stok:', err);
        return res.status(500).send('Gagal update stok');
      }

      res.redirect('/admin/produk');
    });
  });
});


// Hapus produk (GET)
router.get('/admin/hapus/:id_produk', isAuthenticated, (req, res) => {
  const { id_produk } = req.params;
  // Hapus stok dulu
  db.query('DELETE FROM stok WHERE id_produk = ?', [id_produk], (err) => {
    if (err) throw err;
    // Hapus produk
    db.query('DELETE FROM produk WHERE id_produk = ?', [id_produk], (err) => {
      if (err) throw err;
      res.redirect('/admin/produk');
    });
  });
});

// Halaman about (publik)
router.get('/about', (req, res) => {
  res.render('about');
});

module.exports = router;
