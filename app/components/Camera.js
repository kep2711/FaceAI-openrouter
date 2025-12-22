"use client"
import React, { useRef, useState, useEffect, useMemo } from 'react'
import Webcam from 'react-webcam'
import { FiBookOpen, FiCamera, FiRefreshCw } from 'react-icons/fi'
import { analizeAction } from "../action/analizeAction";


const usePotrait = () => {
  const [potrait, setPotrait] = useState(false);

  useEffect(() => {
    const screenMedia = window.matchMedia("(orientation: portrait)")

    const onChange = () => setPotrait(screenMedia.matches)
    onChange()
    screenMedia.addEventListener?.("change", onChange);
    return () => screenMedia.removeEventListener?.("change", onChange)
  }, [])
  return potrait;
}


const cleanUpHtml = (html) => {
  return String(html ?? "")
    .replace(/\bundefined\b\s*$/gi, "")
    .replace(/<\/section>\s*undefined\s*$/gi, "</section>");
};

function Camera() {
  const webcamRef = useRef(null)
  const resultRef = useRef(null)
  const canvasRef = useRef(null)

  const [state, formAction] = React.useActionState(analizeAction, {
    ok: false,
    html: "",
    rid: ""
  })

  const ridRef = useRef("")
  const ridInputRef = useRef(null)

  const [photoDataUrl, setPhotoDataUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMesssage] = useState("")
  const [typeHtml, setTypeHtml] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [responseHtml, setResponseHtml] = useState("")

  const isPotrait = usePotrait();
  const videoConstrains = useMemo(
    () => ({
      facingMode: "user",
      width: { ideal: isPotrait ? 720 : 1280 },
      height: { ideal: isPotrait ? 1280 : 720 },
      frameRate: { ideal: 30, max: 60 }

    }), [isPotrait]
  )

  const CapturePhoto = () => {
    setErrorMesssage("")
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) {
      setErrorMesssage("Kamera belum siap ,coba sebentar boyy !!")
      return;
    }

    const vw = video.videoWidth, vh = video.videoHeight

    const targetW = isPotrait ? 720 : 1280
    const targetH = isPotrait ? 1200 : 720;
    const srcAspect = vw / vh, dstAspect = targetW / targetH;
    let sx = 0, sy = 0, sw = vw, sh = vh;

    if (srcAspect > dstAspect) {
      sh = vh;
      sw = Math.round(vh * dstAspect);
      sx = Math.round((vw - sw) / 2);

    } else {
      sw = vw;
      sh = Math.round(vw / dstAspect);
      sy = Math.round((vh - sh) / 2)
    }
    canvas.width = targetW;
    canvas.height = targetH;

    const context = canvas.getContext("2d");
    context.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);

    const result = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoDataUrl(result)
  }

  const reTake = () => {
    setPhotoDataUrl("")
    setResponseHtml("");
    setTypeHtml("");
    setIsTyping(false);
    setIsLoading(false);
    setErrorMesssage("");
    window?.scrollTo({ top: 0, behavior: "smooth" })
  }
  const onSubmit = (e) => {
    if (!photoDataUrl) {
      e.preventDefault();
      setErrorMesssage("No photo , Please take a photo first");
      return;
    }
    const rid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    ridRef.current = rid;
    if (ridInputRef.current) ridInputRef.current.value = rid;

    setIsLoading(true);
    setTypeHtml("");
    setIsTyping(true);
    setErrorMesssage("");
  }

  useEffect(() => {
    if (!ridRef.current) return;
    if (String(state?.rid ?? "") !== String(ridRef.current)) return;

    setIsLoading(false);

    if (!state.ok) {
      setIsTyping(false);
      setErrorMesssage("Gagal menganalisa foto");
      return;
    }

    const raw = typeof state.html === "string" ? state.html : "";

    if (!raw.trim()) {
      setResponseHtml("");
      setTypeHtml("");
      setIsTyping(false);
      return;
    }

    setResponseHtml(raw);
    resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });

    const parts =
      raw.split(/(?=<p>|<section>|<article>|<ul>|<ol>)/g).filter(Boolean);



    let i = 0;
    setTypeHtml("");
    setIsTyping(true);

    const step = () => {
      if (i >= parts.length) {
        setIsTyping(false);
        return;
      }
      const chunk = String(parts[i++] ?? "");
      if (!chunk) {
        setTimeout(step, 0);
        return;
      }
      setTypeHtml(prev => String(prev ?? "") + chunk);
      setTimeout(step, 160);
    };

    step();
  }, [state]);


  const htmlToRender =
    //  cleanUpHtml(typeHtml || (isTyping ? "" : responseHtml) || "")
    cleanUpHtml(typeHtml || responseHtml || "")

  return (
    <div >
      <div className='relative w-full rounded-2xl overflow-hidden bg-black'>
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={videoConstrains}
          className={`w-full ${isPotrait ? "aspect-[9/16]" : "aspect-video"} object-cover`}
          mirrored
          screenshotFormat='image/jpeg'
          screenshotQuality={0.9}
        />

        {photoDataUrl && (
          <img src={photoDataUrl} alt='capture' className='absolute inset-0 w-full h-full object-cover' />
        )}

        <div className='absolute bottom-2 -translate-1/2 left-1/2 flex items-center gap-3'>
          {!photoDataUrl ? (
            <button onClick={CapturePhoto}
              className='flex items-center justify-center shadow w-14 h-14 rounded-full bg-white text-gray-900 flex'
              title='Take a photo'
            >
              <FiCamera className='w-6 h-6' />
            </button>
          ) : (
            <button onClick={reTake}
              className='flex items-center justify-center shadow w-14 h-14 rounded-full bg-white text-gray-900 flex'
              title='Retake photo'
            >
              <FiRefreshCw className='w-6 h-6' />
            </button>
          )}

          <form action={formAction} onSubmit={onSubmit}>
            <input type='hidden' name='image' value={photoDataUrl} />
            <input ref={ridInputRef} type='hidden' name='rid' defaultValue={""} />

            <button
              type='submit'
              disabled={!photoDataUrl || isLoading}
              className={`px-4 h-14 rounded-xl text-white shadow transition
            ${!photoDataUrl || isLoading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"}`}
              title='analyst & predict'
            >
              {isLoading ? "Process..." : "Predict"}
            </button>
          </form>
        </div>
        {errorMessage && (<p className='text-red-500'>{errorMessage}</p>)}
        <canvas ref={canvasRef} className='hidden' />


      </div>
      <section ref={resultRef} className='w-full'>
        <div className='bg-gray-800 p-6 mt-8 rounded-xl shadow border border-gray-700'>
          <div className='flex items-center gap-2 mb-3 text-xl text-yellow-400 '>
            <FiBookOpen />Predict Result
          </div>
          {
            isTyping && !typeHtml && (
              <div className='flex items-center gap-1 text-sm text-gray-300'>
                <span className='w-2 h-2 rounded-full bg-gray-400 animate-pulse'></span>

                <span className='w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation.delay:.15s]'></span>

                <span className='w-2 h-2 rounded-full bg-gray-400 animate-pulse [animation.delay:.3s]'></span>

              </div>
            )
          }
          {htmlToRender.trim() ? (
            <div
              className='text-base leading-6
               text-base leading-6 text-gray-100

    [&_p]:text-gray-200
    [&_li]:text-gray-200
    [&_strong]:text-emerald-400

    [&_section]:mt-3
    [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-yellow-400
    [&_h3]:mt-2 [&_h3]:font-semibold [&_h3]:text-cyan-400
              '
              dangerouslySetInnerHTML={{ __html: htmlToRender }}
            />
          ) : (
            <div className='bg-gray-500'>
              <p className=' font-semibold text-white'>
                Take a photo , to predict your face
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Camera
