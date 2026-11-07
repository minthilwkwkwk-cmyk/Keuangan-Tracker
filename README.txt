KEUANGAN TRACKER - VERSI PENGEMBANGAN

FITUR BARU
1. Pengaturan > Kategori Aset & Kewajiban:
   - Tambah kategori aset maupun kewajiban.
   - Ubah nama kategori melalui tombol pensil.
   - Hapus kategori kustom yang belum dipakai.
   - Kategori bawaan masih dapat diganti namanya, tetapi tidak dapat dihapus.

2. Menu Investasi:
   - Input Buy, Sell, Dividend, Coupon, dan Fee menggunakan satu field Nominal.
   - Jumlah unit dan harga per unit dihilangkan dari formulir dan riwayat.
   - Setiap transaksi investasi wajib memilih akun cash sumber/tujuan.
   - Buy dan Fee mengurangi saldo cash.
   - Sell, Dividend, dan Coupon menambah saldo cash.
   - Nilai pasar total per instrumen diisi manual pada tabel Posisi & Nilai Pasar.
   - Total Gain/Loss = nilai pasar + hasil penjualan + dividen/kupon - pembelian - biaya.
   - Return adalah return sederhana, bukan XIRR/TWR.

KOMPATIBILITAS DATA
- Database lokal tetap menggunakan nama database yang sama (fintrack).
- Pada pembukaan pertama versi ini, harga pasar per unit dari versi lama dikonversi menjadi nilai pasar total per instrumen.
- Backup lama yang berisi field "prices" masih dapat dipulihkan.
- Tetap lakukan Backup JSON sebelum mengganti file aplikasi.

CARA MEMASANG
1. Di aplikasi lama, buka Pengaturan & Backup > Backup JSON.
2. Simpan file backup di tempat aman.
3. Ekstrak ZIP ini.
4. Salin semua isi folder hasil ekstrak ke folder aplikasi lama, lalu pilih Replace jika diminta.
5. Jalankan Live Server seperti biasa.
6. Refresh Chrome dengan Ctrl + Shift + R.
7. Buka menu Investasi dan Pengaturan untuk mencoba fitur baru.

Catatan: aplikasi menyimpan data di IndexedDB browser lokal. Jangan hapus data browser untuk memasang versi baru.
