<script lang="ts">
  import { onMount, untrack } from 'svelte';

  interface Props {
    text: string;
    delay?: number;
    duration?: number;
    class?: string;
  }
  let { text, delay = 0, duration = 1400, class: klass = '' }: Props = $props();

  let el = $state<HTMLSpanElement | null>(null);
  let out = $state(text);

  const chars = '!<>-_\\/[]{}—=+*^?#________';

  onMount(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const target = untrack(() => text);

    const tick = (now: number) => {
      if (now < start) { raf = requestAnimationFrame(tick); return; }
      const progress = Math.min(1, (now - start) / duration);
      const revealed = Math.floor(progress * target.length);
      let s = '';
      for (let i = 0; i < target.length; i++) {
        if (i < revealed) s += target[i];
        else if (target[i] === ' ') s += ' ';
        else s += chars[Math.floor(Math.random() * chars.length)];
      }
      out = s;
      if (progress < 1) raf = requestAnimationFrame(tick);
      else out = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
</script>

<span bind:this={el} class={klass}>{out}</span>
