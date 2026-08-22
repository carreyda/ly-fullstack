<template>
  <div ref="rootRef" class="login-visual-machine" :class="{ 'login-visual-machine--active': isAnimationActive }">
    <svg viewBox="0 0 720 540" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="machine-deck" x1="0" y1="0" x2="0.78" y2="1">
          <stop offset="0" stop-color="var(--login-machine-deck-highlight)" />
          <stop offset="0.58" stop-color="var(--login-machine-deck-base)" />
          <stop offset="1" stop-color="var(--login-machine-deck-shadow)" />
        </linearGradient>
        <linearGradient id="machine-shell-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--login-machine-shell-highlight)" />
          <stop offset="1" stop-color="var(--login-machine-shell-shadow)" />
        </linearGradient>
        <linearGradient id="machine-shell-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--login-machine-shell-top)" />
          <stop offset="1" stop-color="var(--login-machine-shell-highlight)" />
        </linearGradient>
        <linearGradient id="machine-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--login-machine-screen-start)" />
          <stop offset="1" stop-color="var(--login-machine-screen-end)" />
        </linearGradient>
        <linearGradient id="machine-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--login-machine-glass-highlight)" />
          <stop offset="1" stop-color="var(--login-machine-glass-base)" />
        </linearGradient>
        <radialGradient id="machine-core-glow">
          <stop offset="0" stop-color="var(--login-machine-glow-color)" stop-opacity="0.54" />
          <stop offset="0.62" stop-color="var(--login-machine-glow-color)" stop-opacity="0.12" />
          <stop offset="1" stop-color="var(--login-machine-glow-color)" stop-opacity="0" />
        </radialGradient>
        <filter id="machine-shadow" x="-30%" y="-40%" width="160%" height="190%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="18"
            flood-color="var(--login-machine-shadow-color)"
            flood-opacity="0.34"
          />
        </filter>
        <filter id="machine-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="machine-main-screen-clip">
          <path d="M286 117 447 143v111l-161-26Z" />
        </clipPath>
      </defs>

      <ellipse
        class="login-visual-machine__floor-glow"
        cx="360"
        cy="413"
        rx="278"
        ry="101"
        fill="url(#machine-core-glow)"
      />

      <g class="login-visual-machine__orbit login-visual-machine__orbit--back">
        <ellipse cx="360" cy="390" rx="287" ry="92" />
        <path class="login-visual-machine__data-flow" d="M87 378c32-58 143-90 273-83 133 7 242 49 270 104" />
      </g>

      <g class="login-visual-machine__satellites login-visual-machine__satellites--slow">
        <circle cx="82" cy="374" r="8" />
        <circle cx="637" cy="416" r="6" />
      </g>
      <g class="login-visual-machine__satellites login-visual-machine__satellites--fast">
        <circle cx="176" cy="310" r="5" />
        <circle cx="551" cy="464" r="7" />
      </g>

      <g class="login-visual-machine__base" filter="url(#machine-shadow)">
        <ellipse cx="360" cy="405" rx="246" ry="78" fill="var(--login-machine-deck-shadow)" />
        <path
          d="M114 389v23c0 43 110 79 246 79s246-36 246-79v-23c-29 38-126 66-246 66s-217-28-246-66Z"
          fill="url(#machine-deck)"
          stroke="var(--login-machine-stroke)"
        />
        <ellipse cx="360" cy="387" rx="246" ry="78" fill="url(#machine-deck)" stroke="var(--login-machine-stroke)" />
        <ellipse
          cx="360"
          cy="387"
          rx="200"
          ry="59"
          fill="var(--login-machine-track-fill)"
          stroke="var(--login-machine-stroke)"
        />
        <ellipse
          cx="360"
          cy="387"
          rx="159"
          ry="47"
          fill="var(--login-machine-platform-fill)"
          stroke="var(--login-machine-accent)"
        />
        <path class="login-visual-machine__ring-pulse" d="M201 387c0-26 71-47 159-47s159 21 159 47" />
      </g>

      <g class="login-visual-machine__connections">
        <path d="M177 329 229 351" />
        <path d="M493 334 548 306" />
        <path d="M537 365 583 376" />
        <circle cx="177" cy="329" r="4" />
        <circle cx="548" cy="306" r="4" />
        <circle cx="583" cy="376" r="4" />
      </g>

      <g class="login-visual-machine__database login-visual-machine__float-delay">
        <ellipse cx="576" cy="337" rx="48" ry="17" fill="var(--login-machine-deck-shadow)" opacity="0.42" />
        <path
          d="M546 280v49c0 9 14 17 30 17s30-8 30-17v-49Z"
          fill="url(#machine-shell-front)"
          stroke="var(--login-machine-stroke)"
        />
        <ellipse
          cx="576"
          cy="280"
          rx="30"
          ry="12"
          fill="url(#machine-shell-top)"
          stroke="var(--login-machine-stroke)"
        />
        <path
          d="M547 296c4 8 16 12 29 12s25-4 29-12M547 313c4 8 16 12 29 12s25-4 29-12"
          fill="none"
          stroke="var(--login-machine-accent)"
        />
        <ellipse
          class="login-visual-machine__status-pulse"
          cx="576"
          cy="280"
          rx="17"
          ry="6"
          fill="var(--login-machine-accent-soft)"
        />
      </g>

      <g class="login-visual-machine__panel login-visual-machine__panel--left">
        <path d="m91 214 142-32v112L91 326Z" fill="url(#machine-glass)" stroke="var(--login-machine-panel-stroke)" />
        <path d="M107 302V230l109-25" fill="none" stroke="var(--login-machine-grid)" />
        <path d="m111 281 22-29 24 10 22-38 24 12" fill="none" stroke="var(--login-machine-accent)" stroke-width="3" />
        <g fill="var(--login-machine-accent-soft)">
          <circle cx="111" cy="281" r="4" />
          <circle cx="133" cy="252" r="4" />
          <circle cx="157" cy="262" r="4" />
          <circle cx="179" cy="224" r="4" />
          <circle cx="203" cy="236" r="4" />
        </g>
        <path d="M161 310v35" stroke="var(--login-machine-panel-stroke)" />
      </g>

      <g class="login-visual-machine__panel login-visual-machine__panel--right">
        <path d="m496 183 139 41v111l-139-40Z" fill="url(#machine-glass)" stroke="var(--login-machine-panel-stroke)" />
        <circle cx="599" cy="257" r="22" fill="none" stroke="var(--login-machine-grid)" stroke-width="8" />
        <path d="M599 235a22 22 0 0 1 20 30" fill="none" stroke="var(--login-machine-accent)" stroke-width="8" />
        <g fill="var(--login-machine-accent)">
          <path d="M516 274h10v19h-10zM533 258h10v40h-10zM550 242h10v61h-10z" />
        </g>
        <path d="M559 316v37" stroke="var(--login-machine-panel-stroke)" />
      </g>

      <g class="login-visual-machine__core">
        <g class="login-visual-machine__server">
          <path d="m241 279 180 32 67-38-180-31Z" fill="url(#machine-shell-top)" stroke="var(--login-machine-stroke)" />
          <path
            d="m241 279 180 32v118l-180-32Z"
            fill="url(#machine-shell-front)"
            stroke="var(--login-machine-stroke)"
          />
          <path
            d="m421 311 67-38v118l-67 38Z"
            fill="var(--login-machine-shell-shadow)"
            stroke="var(--login-machine-stroke)"
          />
          <path d="m260 321 84 15v12l-84-15Z" fill="var(--login-machine-accent-soft)" />
          <g class="login-visual-machine__server-lights" fill="var(--login-machine-accent)">
            <circle cx="270" cy="326" r="2.5" />
            <circle cx="279" cy="328" r="2.5" />
            <circle cx="288" cy="329.5" r="2.5" />
          </g>
          <g fill="var(--login-machine-vent)">
            <path d="m383 374 23 4v4l-23-4zM383 383l23 4v4l-23-4zM383 392l23 4v4l-23-4z" />
            <path d="m435 353 30-17v4l-30 17zM435 362l30-17v4l-30 17z" />
          </g>
          <circle
            class="login-visual-machine__status-pulse"
            cx="397"
            cy="411"
            r="7"
            fill="var(--login-machine-accent)"
          />
        </g>

        <g class="login-visual-machine__laptop">
          <path
            d="m272 260 180 32 42-24-180-31Z"
            fill="var(--login-machine-shell-top)"
            stroke="var(--login-machine-stroke)"
          />
          <path
            d="m314 237 138 24v31l-180-32Z"
            fill="var(--login-machine-keyboard-fill)"
            stroke="var(--login-machine-stroke)"
          />
          <g stroke="var(--login-machine-grid)" stroke-width="2">
            <path d="m302 249 112 20M296 255l112 20M330 245l-8 17M350 249l-8 17M370 252l-8 17M390 256l-8 17" />
          </g>
          <path
            d="m275 101 183 31v144l-183-31Z"
            fill="var(--login-machine-screen-frame)"
            stroke="var(--login-machine-panel-stroke)"
            stroke-width="3"
          />
          <path d="m286 117 161 26v111l-161-26Z" fill="url(#machine-screen)" />
          <g clip-path="url(#machine-main-screen-clip)">
            <g class="login-visual-machine__screen-content">
              <path d="m299 146 80 13v7l-80-13Z" fill="var(--login-machine-grid)" />
              <path
                d="m299 174 46 8v36l-46-8ZM355 184l78 13v6l-78-13ZM355 201l57 9v6l-57-9Z"
                fill="var(--login-machine-accent-soft)"
              />
              <path
                d="M369 232v-17l10 2v17m8 2v-27l10 2v27m8 2v-38l10 2v38m8 2v-23l10 2v23"
                stroke="var(--login-machine-accent)"
                stroke-width="6"
              />
              <circle cx="322" cy="193" r="15" fill="none" stroke="var(--login-machine-grid)" stroke-width="8" />
              <path d="M322 178a15 15 0 0 1 14 20" fill="none" stroke="var(--login-machine-accent)" stroke-width="8" />
              <rect
                class="login-visual-machine__scan-line"
                x="276"
                y="128"
                width="186"
                height="16"
                fill="var(--login-machine-scan-color)"
              />
            </g>
          </g>
        </g>
      </g>

      <g class="login-visual-machine__foreground-nodes">
        <g transform="translate(103 431)">
          <rect x="-24" y="-13" width="48" height="26" rx="8" />
          <circle class="login-visual-machine__status-pulse" cx="0" cy="0" r="5" />
        </g>
        <g transform="translate(631 389)">
          <rect x="-20" y="-12" width="40" height="24" rx="12" />
          <circle class="login-visual-machine__status-pulse" cx="0" cy="0" r="5" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const rootRef = useTemplateRef<HTMLDivElement>('rootRef');
const isInViewport = ref(true);
const isDocumentVisible = ref(true);
const isAnimationActive = computed(() => isInViewport.value && isDocumentVisible.value);
let visibilityObserver: IntersectionObserver | undefined;

/**
 * 同步浏览器标签页可见状态
 *
 * 页面切到后台时暂停全部 SVG 动画，避免登录页不可见时仍占用渲染资源。
 */
const syncDocumentVisibility = (): void => {
  isDocumentVisible.value = !document.hidden;
};

onMounted(() => {
  syncDocumentVisibility();
  document.addEventListener('visibilitychange', syncDocumentVisibility);

  if (rootRef.value && 'IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      isInViewport.value = entry?.isIntersecting ?? false;
    });
    visibilityObserver.observe(rootRef.value);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', syncDocumentVisibility);
  visibilityObserver?.disconnect();
  visibilityObserver = undefined;
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
