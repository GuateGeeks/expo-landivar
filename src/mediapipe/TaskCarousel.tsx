import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import "./TaskCarousel.css";
import type { VisionTaskId, VisionTaskMeta } from "./shared/types.ts";

interface TaskCarouselProps {
  tasks: readonly VisionTaskId[];
  taskMeta: Record<VisionTaskId, VisionTaskMeta>;
  taskIcons: Record<VisionTaskId, string>;
  activeTaskId: VisionTaskId;
  isBusy: boolean;
  onSelectTask: (taskId: VisionTaskId) => void;
}

const SCROLL_END_DELAY_MS = 120;
const ACTIVATE_DELAY_MS = 500;

export function TaskCarousel({
  tasks,
  taskMeta,
  taskIcons,
  activeTaskId,
  isBusy,
  onSelectTask,
}: TaskCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemCentersRef = useRef<number[]>([]);
  const activeIndexRef = useRef(0);
  const ignoreScrollRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);
  const activateTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(() => {
    const index = tasks.indexOf(activeTaskId);
    return index >= 0 ? index : 0;
  });
  // Keep ref in sync with state
  activeIndexRef.current = activeIndex;

  const [liveMessage, setLiveMessage] = useState("");

  const clearTimers = useCallback(() => {
    if (scrollEndTimerRef.current) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
    if (activateTimerRef.current) {
      window.clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }
  }, []);

  const measureItemCenters = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(
      track.querySelectorAll<HTMLElement>("[data-carousel-item]"),
    );
    itemCentersRef.current = items.map(
      (item) => item.offsetLeft + item.offsetWidth / 2,
    );
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const centers = itemCentersRef.current;
    if (!centers.length) return;
    const containerCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    centers.forEach((center, index) => {
      const distance = Math.abs(containerCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior, ignoreNextScroll = false) => {
      const track = trackRef.current;
      if (!track) return;
      const centers = itemCentersRef.current;
      if (!centers.length) return;
      const targetCenter = centers[index];
      const targetLeft = Math.max(0, targetCenter - track.clientWidth / 2);
      if (ignoreNextScroll) {
        ignoreScrollRef.current = true;
      }
      track.scrollTo({ left: targetLeft, behavior });
    },
    [],
  );

  const scheduleActivation = useCallback(() => {
    if (isBusy) return;
    if (!mountedRef.current) return;
    const index = activeIndexRef.current;
    clearTimers();
    activateTimerRef.current = window.setTimeout(() => {
      const taskId = tasks[index];
      setLiveMessage(`${taskMeta[taskId].label} selected.`);
      onSelectTask(taskId);
    }, ACTIVATE_DELAY_MS);
  }, [clearTimers, isBusy, onSelectTask, taskMeta, tasks]);

  const handleScroll = useCallback(() => {
    if (ignoreScrollRef.current) {
      ignoreScrollRef.current = false;
      return;
    }
    updateActiveFromScroll();
    if (activateTimerRef.current) {
      window.clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }
    if (scrollEndTimerRef.current) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(() => {
      scheduleActivation();
    }, SCROLL_END_DELAY_MS);
  }, [scheduleActivation, updateActiveFromScroll]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = Math.min(
        tasks.length - 1,
        Math.max(0, activeIndexRef.current + delta),
      );
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollToIndex(nextIndex, "smooth");
      scheduleActivation();
    },
    [scheduleActivation, scrollToIndex, tasks.length],
  );

  const handleItemClick = useCallback(
    (index: number) => {
      if (index === activeIndexRef.current) {
        // Already centered — broadcast is handled by the record ring button above
        return;
      }
      activeIndexRef.current = index;
      setActiveIndex(index);
      scrollToIndex(index, "smooth");
      scheduleActivation();
    },
    [scheduleActivation, scrollToIndex],
  );

  // Mount-time scroll to center (DOM only, no setState)
  useEffect(() => {
    requestAnimationFrame(() => {
      measureItemCenters();
      scrollToIndex(activeIndexRef.current, "auto", true);
      mountedRef.current = true;
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleResize = () => {
      measureItemCenters();
      scrollToIndex(activeIndexRef.current, "auto", true);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [measureItemCenters, scrollToIndex]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <div className="task-carousel">
      <div className="carousel-live" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <div
        ref={trackRef}
        className="carousel-track"
        onScroll={handleScroll}
        role="toolbar"
        aria-label={`Vision task selector, ${tasks.length} tasks`}
      >
        {tasks.map((taskId, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={taskId}
              type="button"
              data-carousel-item
              className={
                isActive
                  ? "carousel-item carousel-item-active"
                  : "carousel-item"
              }
              onClick={() => handleItemClick(index)}
              onKeyDown={handleKeyDown}
              tabIndex={isActive ? 0 : -1}
              aria-label={taskMeta[taskId].label}
              aria-current={isActive ? "true" : undefined}
              aria-selected={isActive}
              aria-setsize={tasks.length}
              aria-posinset={index + 1}
              disabled={isBusy}
            >
              <span className="carousel-item-icon" aria-hidden="true">
                {taskIcons[taskId]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
