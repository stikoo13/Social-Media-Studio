import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";

const ease = [0.22, 1, 0.36, 1];

const platforms = [
  { name: "Instagram", color: "bg-pink-500", formats: [
    { name: "Carousel", slides: 5, ratio: "1:1" },
    { name: "Post", slides: 1, ratio: "1:1" },
    { name: "Story", slides: 1, ratio: "9:16" }
  ]},
  { name: "Facebook", color: "bg-blue-600", formats: [{ name: "Post", slides: 1, ratio: "1:1" }]},
  { name: "X", color: "bg-black text-white", formats: [{ name: "Post", slides: 1, ratio: "text" }]},
  { name: "Reddit", color: "bg-orange-500", formats: [{ name: "Post", slides: 1, ratio: "long" }]},
  { name: "WhatsApp", color: "bg-green-500", formats: [
    { name: "Message", slides: 1, ratio: "text" },
    { name: "Status", slides: 1, ratio: "9:16" }
  ]}
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [slides, setSlides] = useState([]);
  const [platform, setPlatform] = useState(platforms[0]);
  const [format, setFormat] = useState(platforms[0].formats[0]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, slides]);

  const next = () => setActive((i) => Math.min(i + 1, slides.length - 1));
  const prev = () => setActive((i) => Math.max(i - 1, 0));

  const generateSlides = async () => {
    setLoading(true);
    setSlides([]);
    setActive(0);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Create ${format.slides} ${platform.name} ${format.name}. Topic: ${prompt}. Return JSON [{title, body}]` }]
        })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      setSlides(parsed);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (text, index) => {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: text, size: "512x512" })
    });
    const data = await res.json();
    const updated = [...slides];
    updated[index].image = data.data[0].url;
    setSlides(updated);
  };

  const download = async (id) => {
    const node = document.getElementById(id);
    const dataUrl = await toPng(node);
    const link = document.createElement("a");
    link.download = `${id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const getSize = () => {
    if (format.ratio === "9:16") return "w-[360px] h-[640px]";
    if (format.ratio === "text" || format.ratio === "long") return "w-[640px]";
    return "w-[420px] h-[420px]";
  };

  const SlideCard = ({ slide, i }) => (
    <motion.div
      id={`slide-${i}`}
      className={`bg-white rounded-2xl border shadow-xl p-6 flex flex-col ${getSize()}`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease }}
      whileHover={{ y: -8, scale: 1.01, boxShadow: "0px 25px 50px rgba(0,0,0,0.15)" }}
    >
      <motion.div
        contentEditable
        suppressContentEditableWarning
        whileFocus={{ scale: 1.02 }}
        className="font-semibold text-xl mb-3 outline-none text-center focus:ring-2 focus:ring-black/20 rounded"
      >
        {slide.title}
      </motion.div>

      {slide.image && (
        <motion.img
          src={slide.image}
          className="rounded-xl mb-3"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      <motion.div
        contentEditable
        suppressContentEditableWarning
        whileFocus={{ scale: 1.01 }}
        className="text-base text-gray-700 outline-none text-center focus:ring-2 focus:ring-black/20 rounded"
      >
        {slide.body}
      </motion.div>

      <div className="flex gap-3 mt-auto justify-center pt-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          className="px-5 py-2 bg-purple-500 text-white rounded-xl shadow-lg text-base"
          onClick={() => generateImage(slide.title, i)}
        >
          Generate Image
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          className="px-5 py-2 bg-green-500 text-white rounded-xl shadow-lg text-base"
          onClick={() => download(`slide-${i}`)}
        >
          Download
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-sans text-black"
      style={{
        backgroundImage:
          "linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl mb-6 border-b border-black"
      >
        SOCIAL MEDIA STUDIO
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex w-full max-w-2xl gap-3 mb-5"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter idea..."
          className="flex-1 border p-4 rounded-xl shadow focus:ring-2 focus:ring-black/20 outline-none text-base"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          className="px-6 bg-black text-white rounded-xl shadow-lg text-base"
          onClick={generateSlides}
        >
          {loading ? "Generating" : "Generate"}
        </motion.button>
      </motion.div>

      <div className="flex gap-3 mb-3 flex-wrap justify-center">
        {platforms.map((p, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => { setPlatform(p); setFormat(p.formats[0]); }}
            className={`px-4 py-2 rounded-xl shadow-lg border text-base ${p.color}`}
          >
            {p.name}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap justify-center">
        {platform.formats.map((f, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFormat(f)}
            className="px-4 py-2 border rounded-xl shadow text-base"
          >
            {f.name}
          </motion.button>
        ))}
      </div>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base animate-pulse">
          Generating...
        </motion.div>
      )}

      {!loading && slides.length > 0 && (
        <div className="flex flex-col items-center gap-5">
          <AnimatePresence mode="wait">
            <SlideCard key={active} slide={slides[active]} i={active} />
          </AnimatePresence>

          <div className="flex gap-3">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2 }}
                onClick={() => setActive(i)}
                className={`w-14 h-14 rounded-lg border cursor-pointer ${i === active ? "border-black" : "opacity-40"}`}
              />
            ))}
          </div>

          <div className="flex gap-6 items-center">
            <motion.button whileTap={{ scale: 0.9 }} className="text-base" onClick={prev}>Prev</motion.button>
            <div className="text-base">{active + 1}/{slides.length}</div>
            <motion.button whileTap={{ scale: 0.9 }} className="text-base" onClick={next}>Next</motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
