/**
 * Aquibra Slider/Carousel Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface Slide {
  id: string;
  image?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
}

export interface SliderProps {
  slides: Slide[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  height?: string;
}

const defaultSlides: Slide[] = [
  {
    id: "1",
    image: "https://picsum.photos/1200/500?random=1",
    title: "Welcome to Aquibra",
    subtitle: "Build stunning websites visually",
    buttonText: "Get Started",
    buttonUrl: "#",
  },
  {
    id: "2",
    image: "https://picsum.photos/1200/500?random=2",
    title: "Powerful Features",
    subtitle: "Everything you need to create amazing websites",
    buttonText: "Learn More",
    buttonUrl: "#",
  },
  {
    id: "3",
    image: "https://picsum.photos/1200/500?random=3",
    title: "Easy to Use",
    subtitle: "No coding required - just drag and drop",
    buttonText: "Try Now",
    buttonUrl: "#",
  },
];

export const Slider: React.FC<SliderProps> = ({
  slides = defaultSlides,
  autoplay = true,
  autoplayInterval = 5000,
  showDots = true,
  showArrows = true,
  height = "500px",
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Autoplay
  React.useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, activeIndex]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrev = () => {
    goToSlide(activeIndex === 0 ? slides.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    goToSlide(activeIndex === slides.length - 1 ? 0 : activeIndex + 1);
  };

  return (
    <div
      className="aqb-slider"
      style={{
        position: "relative",
        height,
        overflow: "hidden",
      }}
    >
      {/* Slides */}
      <div
        style={{
          display: "flex",
          height: "100%",
          transition: "transform 0.5s ease",
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="aqb-slide"
            style={{
              minWidth: "100%",
              height: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: slide.image
                ? `url(${slide.image}) center/cover no-repeat`
                : slide.backgroundColor || "#1a1a2e",
            }}
          >
            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
              }}
            />

            {/* Content */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                padding: 40,
                maxWidth: 800,
              }}
            >
              {slide.title && (
                <h2
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 16,
                  }}
                >
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: 32,
                  }}
                >
                  {slide.subtitle}
                </p>
              )}
              {slide.buttonText && (
                <a
                  href={slide.buttonUrl}
                  style={{
                    display: "inline-block",
                    padding: "14px 32px",
                    background: "var(--aqb-primary, #00d4aa)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  {slide.buttonText}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && (
        <>
          <button
            onClick={goToPrev}
            style={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            ←
          </button>
          <button
            onClick={goToNext}
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            →
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === activeIndex ? 24 : 10,
                height: 10,
                borderRadius: 5,
                border: "none",
                background:
                  index === activeIndex ? "var(--aqb-primary, #00d4aa)" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const sliderBlockConfig = {
  id: "slider",
  label: "Slider/Carousel",
  category: "Components",
  icon: "🎠",
  elementType: "slider" as const,
  content:
    '<div class="aqb-slider" data-aqb-type="slider">' +
    '<div class="aqb-slide"><h3>Slide One</h3><p>Add your slide copy here.</p></div>' +
    '<div class="aqb-slide"><h3>Slide Two</h3><p>Share another highlight.</p></div>' +
    "</div>",
};

export default Slider;
