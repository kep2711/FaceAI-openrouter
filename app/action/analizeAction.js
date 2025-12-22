"use server"
export async function analizeAction(prevState, formData) {
    const imageDataUrl = String(formData.get("image") || "");
    const rid = String(formData.get("rid") || "");

    if (!imageDataUrl) {
        return {
            ok: false,
            html:
                "<p>No photo.Please take a picture first </p>",
                rid
        }
    }
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        return {
            ok: false,
            html:
                "<p>Please add your API key first </p>",
                rid
        }
    }

    const model = "openai/gpt-4o-mini"
    // "mistralai/mistral-small-3.1-24b-instruct:free"

    const instruction = `
Keluarkan HASIL dalam HTML valid (tanpa <style> eksternal).
Topik: analisis wajah & pose (hiburan).
Nada tegas, profesional, dan DESKRIPTIF.
Jangan minta data lahir.
Hindari hal sensitif serta klaim medis atau keuangan.

Jika TIDAK ada manusia di gambar, balas PERSIS:
<p>Tidak terdeteksi orang. Tolong Anda berada dalam kamera dan ambil foto lagi.</p>

Jika ADA manusia, WAJIB isi SEMUA bagian di bawah.
Setiap paragraf HARUS PANJANG.
DILARANG menjawab singkat.

<section>
  <h2>😊 Ekspresi Wajah</h2>
  <ul>
    <li>Jelaskan emosi dominan secara rinci (MINIMAL 2–3 kalimat).</li>
    <li>Analisis arah pandang, postur, dan gestur tubuh (MINIMAL 2 kalimat).</li>
    <li>Deskripsikan nuansa umum (rapi/kasual/energik) dengan alasan visual.</li>
  </ul>
</section>

<section>
  <h2>🔮 Ramalan dari Wajah</h2>

  <article>
    <h3>💼 Pekerjaan/Karier</h3>
    <p><strong>Indikator:</strong> Jelaskan 3 indikator visual secara detail.</p>
    <p><strong>Ramalan:</strong>
    Tulis MINIMAL 4–6 kalimat.
    Setiap kalimat harus membahas sudut pandang berbeda
    (peluang, tantangan, potensi perkembangan, dan arah karier).
    </p>
  </article>

  <article>
    <h3>❤️ Jodoh/Cinta</h3>
    <p><strong>Indikator:</strong> Analisis bahasa tubuh dan ekspresi (2–3 kalimat).</p>
    <p><strong>Ramalan:</strong>
    Tulis MINIMAL 4–5 kalimat.
    Gunakan bahasa positif, reflektif, dan tidak deterministik.
    </p>
  </article>

  <article>
    <h3>⏳ Masa Depan (1–2 tahun)</h3>
    <p><strong>Indikator:</strong> Hubungkan raut wajah dengan ketekunan & optimisme.</p>
    <p><strong>Ramalan:</strong>
    Tulis MINIMAL 4–6 kalimat tentang arah hidup,
    target realistis, dan potensi perubahan besar.
    </p>
  </article>

  <article>
    <h3>🧠 Sikap & Kepribadian</h3>
    <p><strong>Ciri Tampak:</strong>
    Jelaskan 3–5 ciri kepribadian.
    Setiap ciri WAJIB diberi penjelasan singkat (1 kalimat per poin).
    </p>
  </article>

  <article>
    <h3>🍀 Keberuntungan Minggu Ini</h3>
    <p><strong>Angka:</strong> [1–99], <strong>Warna:</strong> 1 warna, <strong>Skala:</strong> 0–100.</p>
    <p><strong>Penjelasan:</strong>
    Jelaskan arti angka, warna, dan skala keberuntungan (MINIMAL 3 kalimat).
    </p>
    <p><strong>Tips Singkat:</strong>
    Berikan 2–3 kalimat saran praktis.
    </p>
  </article>
</section>

<section>
  <h2>✅ Rekomendasi Cepat</h2>
  <ol>
    <li>To-do 1 (jelaskan manfaatnya).</li>
    <li>To-do 2 (jelaskan dampaknya).</li>
    <li>To-do 3 (jelaskan tujuan jangka pendek).</li>
  </ol>
</section>`

    const body={
        model,
        messages:[
            {
            role:"system",
            content:"Anda sistem penganalisis foto.Keluarkan HTML ringkas dan aman "

        },{
            role:"user",
            content:[
                {type:"text",text:instruction},
                {type:"image_url",image_url: {url: imageDataUrl}}
            ]
        }
    
        ],
        max_tokens:1600,
        temperature:0.2
    }

    const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers: {
            Authorization:`Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type":"application/json",
            "HTTP-Referer":"http://localhost:3000",
            "X-Title": "Kamera Ramalan Foto"
        },
        body:JSON.stringify(body),
        cache:"no-store"

    });
    if(!res.ok){
        const t=await res.text()
        console.error("ERROR:",res.status,t)
        return {
            ok: false,
            html:
                "<p>Failed call the AI </p>",
            rid
        }
    }
    const data=await res.json();

    const html=String(data?.choices?.[0]?.message?.content ?? "")
    return{ok:true,html,rid}
}