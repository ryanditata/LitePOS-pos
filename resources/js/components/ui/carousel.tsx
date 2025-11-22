import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselContextProps {
  currentIndex: number
  setCurrentIndex: (index: number) => void
  totalItems: number
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ orientation = "horizontal", className, children, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [totalItems, setTotalItems] = React.useState(0)

    const canScrollPrev = currentIndex > 0
    const canScrollNext = currentIndex < totalItems - 1

    const scrollPrev = React.useCallback(() => {
      if (canScrollPrev) {
        setCurrentIndex((prev) => prev - 1)
      }
    }, [canScrollPrev])

    const scrollNext = React.useCallback(() => {
      if (canScrollNext) {
        setCurrentIndex((prev) => prev + 1)
      }
    }, [canScrollNext])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      const items = React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type === CarouselContent
      )
      if (items.length > 0) {
        const content = items[0] as React.ReactElement<{children: React.ReactNode}>
        const itemCount = React.Children.count(content.props.children)
        setTotalItems(itemCount)
      }
    }, [children])

    return (
      <CarouselContext.Provider
        value={{
          currentIndex,
          setCurrentIndex,
          totalItems,
          canScrollPrev,
          canScrollNext,
          scrollPrev,
          scrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDown={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { currentIndex } = useCarousel()

  return (
    <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {children}
      </div>
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 border-0 text-white shadow-lg backdrop-blur-sm transition-all duration-200",
        !canScrollPrev && "opacity-50",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 border-0 text-white shadow-lg backdrop-blur-sm transition-all duration-200",
        !canScrollNext && "opacity-50",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

// Komponen untuk indicators/dots
const CarouselIndicators = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { currentIndex, setCurrentIndex, totalItems } = useCarousel()

  if (totalItems <= 1) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1 bg-black/20 rounded-full px-2 py-1",
        className
      )}
      {...props}
    >
      {Array.from({ length: totalItems }).map((_, index) => (
        <button
          key={index}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-200",
            index === currentIndex 
              ? "bg-white scale-110" 
              : "bg-white/60 hover:bg-white/80"
          )}
          onClick={() => setCurrentIndex(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
})
CarouselIndicators.displayName = "CarouselIndicators"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
}
