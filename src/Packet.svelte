<script lang="ts">
  import type { Packet } from "./types.ts";

  export let packet: Packet;
  export let current: any;
  export let idx: any;
</script>

<!-- UI Start. -->
<div
        class="tr"
        class:current
        on:click
        on:keyup
        class:o={idx % 2}
>
  <div class="time">{#if packet.time}{packet.time.toFixed(0)}{/if}</div>
  <div class="idx">{idx + 1}</div>
  <div class="src">
    <span class="{packet.source}">{packet.source.toUpperCase()}</span>
  </div>
  <div class="id">{packet.packetId}</div>
  <div class="name">{packet.packetName}</div>
  <div class="len">{packet.length}</div>
  <div class="json">
    <span>{packet.data}</span>
  </div>
</div>
<!--  UI End.  -->

<style>
    .tr.o > div {
        background: rgba(255,255,255,0.07);
    }
    .tr > div {
        border-right: 1px solid rgba(255,255,255,0.1);
        font-size: 0.9em;
    }
    .tr > .time {
        font-size: 0.8em;
    }
    .tr > .idx {
        font-size: 0.8em;
    }
    .tr > .src {
        font-size: 0.8em;
        text-align: center;
    }
    .tr > .src span {
        border: 1px solid rgba(255,255,255,0.2);
        display: inline-block;
        border-radius: 2px;
        padding: 0.1em 0.2em;
    }
    .tr > .src span.client {
        background: #2E79A0;
    }
    .tr > .src span.server {
        background: #976115;
    }
    .tr > .id {
        font-family: monospace;
        font-weight: 1000;
        width: 0;
    }
    .tr > .len {
        font-family: monospace;
        font-weight: 1000;
        width: 0;
    }
    .tr > .json {
        width: 0;
    }
    .tr > .json span {
        display: block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        opacity: 0.7;
    }

    .current {
        background: #204e8a;
    }
</style>
