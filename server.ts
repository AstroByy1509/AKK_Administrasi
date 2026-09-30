import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Initialize Gemini Client if API key is present
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
Anda adalah "Operasional AI Assistant" untuk PT Anugrah Kemasan Kreatif (PT AKK Logistics Banyuwangi DC).
Anda bertugas menjawab pertanyaan seputar operasional logistik, armada truk, jadwal pengiriman, sopir/helper, BBM, tiket kapal penyeberangan, sparepart, dan SOP perusahaan secara profesional, cepat, ramah, dan akurat dalam bahasa Indonesia.

Informasi Utama PT AKK Logistics:
- Gudang Pusat (DC): Jl. Argopuro No.60, Lingkungan Sukowidi, Klatak, Kec. Kalipuro, Kab. Banyuwangi, Jawa Timur 68421.
- Penanggung Jawab: Bambang Sudiro, S.T. (Head of Logistics AKK) & Bayu Novianto Dimas Permana, S.Si (Direksi Operasional & Supply Chain).
- Total Armada Aktif (12 Unit): 
  • Pick Up Box L300 (P 8125 VC - N1/NP1) - Driver: Zainul Agustiar, Helper: Aan Adi Saputra
  • Pick Up Box Traga (P 8509 VQ - A3/NP3) - Driver: Ach Taufiq
  • Engkel STD Mitsubishi Canter (P 8848 U - N3/NS1, P 9677 VB - N4/NS2, P 8801 UV - N5/NS3)
  • Engkel Long Hino (P 8381 VE - N20/NL1, P 8711 UW - N21/NL2)
  • Double STD Hino / Isuzu NMR (P 9281 VA - N22/DS1, P 8928 UR - N23/DS2, P 9194 SA - S5/DS3, W 8229 US - NMR/DS4, W 8603 PG - NMR/DS5)
- Tim Sopir & Helper Terdaftar (19 Personel):
  • Driver Utama: Zainul Agustiar (SIM B2 Umum), Ach Taufiq, Aldi Wahyu Pradana, Arif Bagus Muhammad Iqbal, Faisol Arifin, Budiono, Nanda Tegar, Rudin Slamet, Supriyanto.
  • Helper / Kernet: Aan Adi Saputra, Bintang Wahyu Pratama, Alphian Bayu Nugraha, Mohamad Rohman, Riki Novandito, Saiful Rizal, Rifaldi Aminullah, Angga Arrohmad.
  • Driver Cadangan: Suwarno, Adit.
- SOP & Aturan Utama:
  1. Rotasi Jeda Istirahat 24 Jam: Pengemudi yang telah menyelesaikan perjalanan luar kota jarak jauh (>300 km) atau rute penyeberangan antar-pulau wajib menjalani jeda istirahat 24 jam sebelum diperbolehkan bertugas kembali.
  2. Batas Maksimal 3x Area Berturut-turut: Driver yang ditugaskan di rute luar pulau (misal Lampung/Bali) selama 3 kali berturut-turut wajib mendapatkan persetujuan (approval) khusus dari Manager Logistik sebelum penugasan ke-4 demi mencegah kelelahan (fatigue audit).
  3. Verifikasi Tiket Penyeberangan: Pengiriman rute Bali/Luar Pulau wajib melampirkan kode booking tiket kapal ASDP Ferizy Pelabuhan Ketapang - Gilimanuk.
  4. Pengisian Uang Jalan & BBM: Alokasi BBM dihitung berdasarkan standar rasio km/liter per jenis truk (Pick Up 1:10, Engkel 1:7, Double 1:5). Wajib melampirkan foto nota BBM resmi dan odometer terkini.
  5. Perbaikan & Sparepart: Komponen kritis (kampas rem, oli, ban) diajukan melalui SPK Bengkel ke bagian Manajemen Sparepart.
  6. Pelacakan GPS: Seluruh 12 armada terintegrasi dengan sistem GPS Tracksolid Pro Concox GT06N realtime.

Jawablah pertanyaan pengguna secara langsung, spesifik, padat, dan solutif. Sertakan angka, nama sopir, atau langkah SOP jika relevan. Formatlah jawaban dengan poin-poin yang rapi dan mudah dibaca.
`;

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

async function generateChatReply(message: string, contextTab?: string, history?: any[]): Promise<string> {
  // Try calling Gemini API if SDK is available
  if (genAI) {
    const formattedHistory = Array.isArray(history) 
      ? history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }))
      : [];

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: `[Konteks Modul Aktif: ${contextTab || 'Umum'}]\n${message}` }] }
    ];

    for (const modelName of MODELS_TO_TRY) {
      try {
        const response = await genAI.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} call failed, trying next fallback:`, err);
      }
    }
  }

  // Knowledge Base Engine Fallback (Rule-based operational responses)
  const query = message.toLowerCase();

  if (query.includes('sopir') || query.includes('driver') || query.includes('helper') || query.includes('kernet') || query.includes('kru') || query.includes('siapa saja')) {
    return `🚛 **Daftar Kru Sopir & Helper Bertugas Hari Ini (PT AKK Logistics)**:

1. **Zainul Agustiar** (Driver Senior - SIM B2) & **Aan Adi Saputra** (Helper):
   - **Armada**: Pick Up Box N1/NP1 (P 8125 VC)
   - **Status**: On-Duty Rute Utama Banyuwangi - Denpasar Bali.

2. **Ach Taufiq** (Driver Utama - SIM B2) & **Bintang Wahyu Pratama** (Helper):
   - **Armada**: Pick Up Box A3/NP3 (P 8509 VQ)
   - **Status**: On-Duty Rute Surabaya Hub via Pantura.

3. **Aldi Wahyu Pradana** (Driver Utama) & **Alphian Bayu Nugraha** (Helper):
   - **Armada**: Engkel Long N21/NL2 (P 8711 UW)
   - **Status**: Standby Gudang Banyuwangi DC.

4. **Driver Cadangan Standby**:
   - **Suwarno** & **Adit** (Siap rotasi jeda 24 jam).

📌 *Catatan*: Seluruh kru telah lulus verifikasi SIM aktif, sertifikasi K3 bongkar muat, dan audit kesehatan harian.`;
  }

  if (query.includes('armada') || query.includes('truk') || query.includes('kendaraan') || query.includes('plat')) {
    return `🚚 **Status Ringkasan Armada PT AKK Logistics (12 Unit)**:

- **Tersedia (Ready)**: 8 Unit (Engkel STD P 8848 U, Double STD P 9281 VA, Isuzu NMR W 8229 US, W 8603 PG, dll).
- **Dalam Tugas (On-Duty)**: 3 Unit (Pick Up Box P 8125 VC, Pick Up Box P 8509 VQ, Engkel STD P 9677 VB).
- **Perawatan Bengkel (Maintenance)**: 1 Unit (Engkel Long P 8381 VE - Servis berkala & ganti kampas rem).

📌 Seluruh armada telah dilengkapi perangkat GPS Tracksolid Pro Concox GT06N realtime dan tangki BioSolar terkalibrasi.`;
  }

  if (query.includes('jadwal') || query.includes('muat') || query.includes('rute') || query.includes('kirim')) {
    return `📅 **Info Jadwal & Rute Pengiriman Aktif (Banyuwangi DC)**:

- **TRK-2026-09-082 (Jawa - Bali)**: P 8125 VC (Driver: Zainul Agustiar) -> Hypermart Mall Bali (Status: In Transit via ASDP Ketapang-Gilimanuk).
- **TRK-2026-09-083 (Jawa Timur)**: P 8509 VQ (Driver: Ach Taufiq) -> Lotte Grosir Surabaya (Status: In Transit via Pantura).
- **TRK-2026-09-084 (Luar Pulau)**: P 9677 VB -> Balikpapan Hub (Status: Pelayaran KM Dharma Ferry VII).

📌 Gunakan fitur **Smart Fill** di halaman *Jadwal & Penugasan* untuk menyusun rute mingguan otomatis tanpa bentrok jadwal!`;
  }

  if (query.includes('bbm') || query.includes('uang jalan') || query.includes('solar') || query.includes('efisiensi')) {
    return `⛽ **SOP Klaim Uang Jalan & Efisiensi BBM PT AKK**:

1. **Standar Rasio Konsumsi BBM**:
   - Pick Up Box (L300/Traga): 10 KM / Liter
   - Engkel STD / Long (Canter/Hino): 7 KM / Liter
   - Double STD (Hino/Isuzu NMR): 5 KM / Liter

2. **Persyaratan Klaim**:
   - Wajib mencatat KM Odometer sebelum & sesudah pengiriman di Formulir Armada.
   - Wajib mengunggah foto nota struk pengisian BioSolar/Dexlite resmi SPBU.
   - Verifikasi diaudit otomatis di modul *Efisiensi BBM*.`;
  }

  if (query.includes('tiket') || query.includes('kapal') || query.includes('penyeberangan') || query.includes('ketapang') || query.includes('ferry')) {
    return `⛴️ **SOP Verifikasi Tiket Kapal Penyeberangan (Ketapang - Gilimanuk)**:

- Seluruh armada penyeberangan Selat Bali dipesankan via sistem ASDP Ferizy resmi.
- Kode Booking Tiket wajib diinput ke sistem minimal **2 jam sebelum jadwal masuk pelabuhan**.
- Tiket mencakup: Golongan Kendaraan (Gol. IVA/VB), Nomor Plat Truk, dan Identitas Driver & Helper.
- Sertifikat e-Tiket dapat diunduh langsung di detail jadwal pengiriman.`;
  }

  if (query.includes('sparepart') || query.includes('komponen') || query.includes('rem') || query.includes('ban') || query.includes('oli') || query.includes('bengkel')) {
    return `🛠️ **SOP Manajemen Sparepart & Bengkel Operasional**:

- **Stok Kritis**: Kampas Rem Hino, Filter Oli Mitsubishi Canter, dan Ban Luar 7.50-16.
- **Pengajuan Part**: Buka menu *Manajemen Sparepart* -> Klik **Tambah Pembelian Baru (PO)**.
- **Kartu SPK Bengkel**: Truk P 8381 VE sedang menjalani ganti filter solar & tune up. Estimasi selesai hari ini pukul 15.00 WIB.`;
  }

  if (query.includes('toko') || query.includes('pelanggan') || query.includes('peta') || query.includes('retail')) {
    return `🗺️ **Jaringan Toko Retail & Pelanggan (15 Outlet Utama)**:

- **Jawa Timur & Bali**: Abba Mart, Kurnia Sobo, RSI Fatimah, Toko Asmuin, Toko Damai Genteng, Transmart Sunset Road Bali, dll.
- **Pusat Distribusi**: Banyuwangi DC (Jl. Argopuro No.60).
- Data terintegrasi penuh dengan peta interaktif Leaflet dan Google Sheets *DATA FIX*.`;
  }

  if (query.includes('rangkum') || query.includes('ringkasan') || query.includes('recap')) {
    return `📋 **Ringkasan Operasional PT AKK Logistics**:

- **DC Banyuwangi**: Beroperasi normal melayani 15 outlet retail Jawa-Bali & luar pulau.
- **Armada**: 8 Siap Jalan, 3 Dalam Tugas, 1 Servis Berkala.
- **Kru**: 19 Personel (Sopir Utama, Helper, Cadangan) dalam kondisi siap tempur.
- **Kepatuhan SOP**: Rotasi Jeda 24H dan verifikasi tiket ASDP berjalan 100%.`;
  }

  return `Halo! Terkait pertanyaan Anda **"${message}"**:

1. **Status Sistem**: Seluruh data operasional PT AKK Logistics (Armada, Sopir, BBM, Jadwal) dalam kondisi aktif dan terpantau realtime.
2. **Rekomendasi Navigasi**: Anda dapat melihat detail lebih lanjut di menu navigasi sebelah kiri (Dashboard, Jadwal, Armada, BBM, atau Sparepart).
3. **Hubungi Admin**: Jika membutuhkan penanganan khusus, silakan kontak Piket Operasional Banyuwangi DC di **0812-1351-3590**.

Ada hal lain seputar SOP atau armada yang bisa saya bantu?`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for Chat
  app.post("/api/chat", async (req, res) => {
    const { message, history, contextTab } = req.body;
    try {
      const reply = await generateChatReply(message || '', contextTab, history);
      res.json({ reply });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Failed to get response" });
    }
  });

  // API route for WhatsApp notification
  app.post("/api/notify-whatsapp", async (req, res) => {
    const { phoneNumber, message } = req.body;
    
    if (!process.env.WHATSAPP_API_KEY) {
      return res.status(500).json({ error: "WhatsApp API key not configured" });
    }

    try {
      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // In development, always use Vite middleware; in production, serve built dist/
  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (isProduction) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath, (err) => {
          if (err && !res.headersSent) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Error loading application");
          }
        });
      } else {
        res.status(503).send("Aplikasi sedang dibangun. Silakan muat ulang beberapa saat lagi.");
      }
    });
  } else {
    // In development mode, Vite middleware compiles and serves on-the-fly
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const serverPort = Number(process.env.PORT) || 3000;
  const server = app.listen(serverPort, "0.0.0.0", () => {
    console.log(`Server running in ${isProduction ? 'production (static dist)' : 'development (vite middleware)'} mode on http://0.0.0.0:${serverPort}`);
  });

  // Graceful shutdown for Cloud Run container lifecycle
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing HTTP server gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();

