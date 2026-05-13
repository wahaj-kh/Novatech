import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface Hotspot {
  id: number;
  top: string;
  left: string;
  title: string;
  description: string;
}

interface HeroSettings {
  title: string;
  description: string;
  image_url: string | null;
  hotspots: Hotspot[];
}

export default function FeatureSpotlight() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [settings, setSettings] = useState<HeroSettings | null>(null);

  useEffect(() => {
    api.get('/settings/hero').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden bg-zinc-50 dark:bg-zinc-950 min-h-[80vh]">
      {!settings ? (
        <div className="flex justify-center items-center h-full text-muted-foreground pt-20">
          Loading Spotlight...
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
              dangerouslySetInnerHTML={{ __html: settings.title.replace('\n', '<br className="md:hidden" />') }}
            />
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              {settings.description}
            </motion.p>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* The Device Container */}
            <motion.div 
              style={{ y: y1, scale: scale1 }}
              className="relative w-full aspect-[16/10] bg-zinc-200 dark:bg-zinc-900 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-2xl overflow-visible flex items-center justify-center"
            >
              {settings.image_url ? (
                <img src={settings.image_url} alt="Device Preview" className="w-full h-full object-contain p-8" />
              ) : (
                <span className="text-zinc-500 font-medium tracking-widest uppercase text-sm z-0">Device Preview Render</span>
              )}
              
              {/* Hotspots */}
              {settings.hotspots.map((spot) => (
                <div
                  key={spot.id}
                  className="absolute z-20 group"
                  style={{ top: spot.top, left: spot.left }}
                  onMouseEnter={() => setActiveHotspot(spot.id)}
                  onMouseLeave={() => setActiveHotspot(null)}
                >
                  {/* Pulsing circle */}
                  <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer w-10 h-10">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary shadow-lg border-2 border-white dark:border-zinc-900 group-hover:scale-125 transition-transform duration-300"></span>
                  </div>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {activeHotspot === spot.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-48 p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 pointer-events-none"
                      >
                        <h4 className="font-semibold text-sm mb-1">{spot.title}</h4>
                        <p className="text-xs text-muted-foreground">{spot.description}</p>
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/90 dark:border-t-zinc-900/90"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </div>
        </>
      )}
    </section>
  );
}
