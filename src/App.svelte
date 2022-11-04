<script lang="ts">
    import Packet from "./Packet.svelte";
    import VirtualList from "svelte-virtual-list-ce";
    
    import { tick } from "svelte";
    import { JSONEditor } from "svelte-jsoneditor";
    import "svelte-jsoneditor/themes/jse-theme-dark.css";

    // Property declaration.
    let stick: any = null;
    let packets: any[] = [];
    let filteredPackets: any[] = [];
    let currentPacket: any | null = null;
    let filter: string = "", jsonFilter: string = "";
    let endIndex: number = 0, filterEndIndex: number = 0;
    let node: any, details: any, filterTableHost: any, orand: boolean = true;
    
    let editorCss: string = "";
    let editor: JSONEditor, decodeEditor: any = true;

    let tableHost: any = null;
    let showDecode: boolean = true;

    let reconnectInterval = null;
    let webSocket = new WebSocket("ws://localhost:8080");
    webSocket.onopen = () => {
        clear();

        console.log("Connected to relay server.");
        webSocket.send(JSON.stringify({ packetId: 0 }));
        
        if (reconnectInterval) {
            alert("Reconnected to relay server.");
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };
    webSocket.onclose = () => {
        alert("Lost connection to relay server.");
        console.log("Disconnected from relay server.");
        
        reconnectInterval = setInterval(() => {
            console.log("Attempting to reconnect to relay server...");
            webSocket = new WebSocket("ws://localhost:8080");
        }, 5000);
    };
    webSocket.onerror = error => {
        console.log("Error: " + error);
    };
    webSocket.onmessage = message => {
        const data = JSON.parse(message.data);
        const packetId = data.packetId;
        const packetData = data.data;

        switch (packetId) {
            default:
                console.log("Unknown packet id: " + packetId);
                return;
            case 0:
                showPacket({
                    time: message.timeStamp,
                    source: "client",
                    packetId: 0,
                    packetName: "Handshake",
                    length: packetData.length,
                    data: JSON.stringify({ timestamp: packetData })
                });
                return;
            case 1:
                // Parse the packet data.
                const packet = JSON.parse(packetData);
                // Change the timestamp.
                packet.time = message.timeStamp;
                
                // Visualize the packet on the frontend.
                showPacket(packet);
                return;
        }
    }

    /**
     * Pushes a packet to the packet list.
     * @param packet The packet to push.
     */
    function showPacket(packet) {
        packet.index = packets.length;
        packets.push(packet);
        packets = packets;
    }
    
    /**
     * Scrolls to the specified index.
     */
    let scrollToIndex = () => {};

    /**
     * Scrolls to the specified item.
     */
    let scrollToIndexFilter = () => {};

    /**
     * Scrolls to the end of the chain.
     */
    function scrollToEnd() {
        scrollToIndex(packets.length - 1, { behavior: "auto" });
    }
    
    /**
     * Clears the stored packets.
     */
    function clear() {
        packets = [];
    }

    /**
     * Copies data about the currently selected packet.
     */
    function copyCurrentPacket() {
        copyToClipboard(currentPacket.data);
    }

    /**
     * Shows details about a packet.
     * @param packet The packet to show details about.
     */
    function showPacketDetails(packet) {
        currentPacket = packet;
        tick().then(() => {
            if (packet.data && packet.decode && showDecode) {
                editorCss = "two-editor";
            } else {
                editorCss = "one-editor";
            }
            if (!packet.data && packet.decode){
                showDecode = true;
            }
            if (packet.data) {
                editor.set({ json: JSON.parse(packet.data) });
            }
            if (showDecode && packet.decode) {
                decodeEditor.set({ json: JSON.parse(packet.data) });
            }
        });
    }

    /**
     * Handles rendering the packet flyout menu.
     * @param mode The mode to render.
     * @param items The items to render.
     */
    function handleRenderMenu(mode, items) {
        const rawDecButton = {
            onClick: toggleShowDecode,
            text: "RD",
            title: "Raw Decode",
            className: "jse-button raw-decode-btn",
        };

        const space = { space: true };
        const separator = { separator: true };
        const itemsWithoutSpace = items.slice(0, items.length - 1);
        return itemsWithoutSpace.concat([separator, rawDecButton, space]);
    }
    
    /**
     * Creates a packet filter from a packet and the current filters.
     */
    function packetFilter(packet) {
        if(!filter.length && !jsonFilter.length) return false;
        let and: any = filter.length && jsonFilter.length;
        if(!orand) and = false;
        let text, json;
        if(filter.length && packet.packetName.includes && 
          packet.packetName.toLowerCase().includes(filter.toLowerCase())) text = true;
        if(filter.length && ('' + packet.packetId).includes(filter)) text = true;
        if(!and && text) return true;
        if(jsonFilter.length && packet.object && 
          JSON.stringify(packet.object).toLowerCase().includes(jsonFilter.toLowerCase())) json = true;
        if(!and && json) return true;
        return !!(and && text && json);
    }

    /**
     * Toggles the show decode state.
     * Displays the current packet.
     */
    function toggleShowDecode() {
        tick().then(() => {
            showDecode = !showDecode;
            showPacketDetails(currentPacket);
        });
    }
    
    /*
     * Browser utilities.
     */

    /**
     * Invoked when the page moves.
     * @param event The event.
     */
    function move(event: any) {
        const rect: any = node.getBoundingClientRect();
        details.style.width = 100 - (((event.clientX - rect.left) / node.offsetWidth) * 100) + '%';
    }
    
    /**
     * Invoked when the resize event is done.
     * @param event The event.
     */
    function stopResize(event: any) {
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('mousemove', move);
        node.style.userSelect = null;
    }
    
    /**
     * Copies the specified text to the user's clipboard.
     * @param text The data to place in the clipboard.
     */
    function copyToClipboard(text: string) {
        if (window.clipboardData && window.clipboardData.setData) {
            // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
            return window.clipboardData.setData("Text", text);
        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            const textArea = document.createElement("textarea");
            textArea.textContent = text;
            textArea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            } catch {
                console.warn("Copy to clipboard failed.");
                return prompt("Copy to clipboard: Ctrl + C, Enter", text);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * Invoked when the browser window is resized.
     * @param event The event.
     */
    function onResize(event: Event) {
        node.style.userSelect = 'none';
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stopResize);
    }
    
    $: if(filter.length || jsonFilter.length || orand) {
        tick().then(() => {
            filteredPackets = packets.filter(packetFilter, filter, jsonFilter);
            setTimeout(() => {
                scrollToIndexFilter(10, {behavior: 'auto'})
                scrollToIndexFilter(0, {behavior: 'auto'})
            }, 10);
        });
    } else {
        tick().then(() => {
            filteredPackets = [];
        });
    }

    $: {
        tick().then(() => scrollToEnd(filter, jsonFilter));
    }
    
    $: if (stick) {
        tick().then(() => scrollToEnd(packets));
    }
</script>

<svelte:head>
    <!--{@html materialDarker}-->
</svelte:head>

<!-- Start UI. -->
<aside>
    <button title="Clear" data-icon="clear" class="red" on:click={clear}></button>
    <button title="Lock scroll at the bottom" data-icon="keyboard_arrow_down" style="margin-top: auto;" class:green={stick} on:click={() => stick = !stick}></button>
    {#if currentPacket}
        <button title="Copy current packet" data-icon="collections_bookmark" on:click={copyCurrentPacket}></button>
    {:else}
        <button title="Copy current packet" data-icon="insert_drive_file" style="margin-top: auto; opacity: 0.5"></button>
        <button title="Copy current packet" data-icon="collections_bookmark" style="opacity: 0.5"></button>
    {/if}
</aside>

<main bind:this={node}>
    <div class="main-host">
        <div class="filter-host">
            <input type="text" bind:value={filter} placeholder=" PACKET" />
            <div class="orand" on:click={() => orand = !orand}>
                <span and class:s={orand}>AND</span>
                <span or class:s={!orand}>OR</span>
            </div>
            <input type="text" bind:value={jsonFilter} placeholder=" JSON" />
        </div>
        
        <div class="results-host" class:open={filter.length || jsonFilter.length}>
            <div class="table">
                <div class="tr thead">
                    <div class="time">Time</div>
                    <div class="idx">#</div>
                    <div class="src">Sender</div>
                    <div class="id">ID</div>
                    <div class="name">Packet Name</div>
                    <div class="len">Length</div>
                    <div class="json">Data</div>
                </div>
                <div class="tbody" bind:this={filterTableHost}>
                    <VirtualList items={filteredPackets} let:item={packet} bind:scrollToIndexFilter bind:end={filterEndIndex}>
                        <Packet packet={packet} idx={packet.index} current={packet == currentPacket} on:click={() => {
                            scrollToIndex(packet.index); showPacketDetails(packet);
                        }}/>
                    </VirtualList>
                </div>
            </div>
        </div>
        
        <div class="table-host">
            <div class="table">
                <div class="tr thead">
                    <div class="time">Time</div>
                    <div class="idx">#</div>
                    <div class="src">Sender</div>
                    <div class="id">ID</div>
                    <div class="name">Packet Name</div>
                    <div class="len">Length</div>
                    <div class="json">Data</div>
                </div>
                <div class="tbody" bind:this={tableHost}>
                    <VirtualList items={packets} let:item={packet} bind:scrollToIndex bind:end={endIndex}>
                        <!-- this will be rendered for each currently visible item -->
                        <Packet packet={packet} idx={packet.index} current={packet == currentPacket} on:click={() => showPacketDetails(packet)}/>
                    </VirtualList>
                </div>
            </div>
        </div>
    </div>
    
    <div class="resize" on:mousedown={onResize}></div>
    
    <div class="details-host" bind:this={details}>
        {#if currentPacket}
            {#if currentPacket.data}
                <div class="{editorCss} jse-theme-dark">
                    <JSONEditor
                            bind:this={editor}
                            onRenderMenu={handleRenderMenu}
                            readOnly
                    />
                </div>
            {/if}
            
            {#if currentPacket.decode && showDecode}
                <div class="{editorCss} jse-theme-dark">
                    <JSONEditor bind:this={decodeEditor} readOnly />
                </div>
            {/if}
        {/if}
    </div>
</main>
<!--  End UI.  -->

<style>
    .resize {
        /*position: absolute;*/
        top: 0;
        height: 100%;
        width: 10px;
        margin-left: -2px;
        margin-right: -8px;
        background: rgba(255, 255, 255, 0.05);
        z-index: 2;
    }

    .resize:hover {
        background: rgba(255, 255, 255, 0.3);
        cursor: w-resize;
    }

    aside {
        background: rgba(0,0,10,0.4);
        flex-grow: 0;
        display: flex;
        flex-direction: column;
    }

    aside button {
        font-size: 1.75em;
        margin-bottom: 0.3em;
    }

    main {
        display: flex;
        flex-grow: 1;
        overflow: hidden;
    }

    input::placeholder {
        font-family: 'shicon', Open Sans, sans-serif;
        color: white;
        letter-spacing: 2px;
        font-size: 0.8em;
    }

    input[type="text"] {
        background: black;
        color: white;
        height: 3rem;
        border: none;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        padding: 0 1rem;
        flex-grow: 1;
        font-size: 1.4em;
        font-family: monospace;
    }

    .main-host {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .filter-host {
        width: 100%;
        display: flex;
    }

    .table-host {
        flex-grow: 1;
        overflow: hidden;
        background: rgba(0,0,10,0.6);
    }

    .table {
        width: 100%;
        min-width: 100%;
        cursor: default;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
    }

    .table :global(.tr) {
        display: flex;
    }

    .table :global(.tr > .time) {
        flex-basis: 3rem;
        display: flex;
        justify-content: center;
    }

    .table :global(.tr > .idx) {
        flex-basis: 2.5rem;
        display: flex;
        justify-content: center;
    }

    .table :global(.tr > .src) {
        flex-basis: 4rem;
        display: flex;
        justify-content: center;
    }

    .table :global(.tr > .id) {
        flex-basis: 3rem;
        justify-content: center;
    }

    .table :global(.tr > .name) {
        flex-basis: 20rem;
    }

    .table :global(.tr > .len) {
        flex-basis: 3rem;
    }

    .table :global(.tr > .json) {
        flex-grow: 1;
    }

    .table .thead > * {
        text-align: left;
        background: rgba(0,0,0,0.4);
        border-right: 1px solid rgba(255,255,255,0.1);
        font-size: 0.8em;
    }

    .table .tbody {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
    }

    .table :global(.tr > *) {
        padding: 0.5rem 0.6rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .table :global(.tr:hover > *) {
        background: rgba(100,130,255,0.2) !important
    }

    .details-host {
        /*flex-basis: 40%;*/
        /*flex-grow: 1;*/
        width: 30%;
        background: rgba(0,0,0,0.2);
        border-top: 2px solid rgba(255,255,255,0.2);
        overflow-y: auto;
        overflow-x: hidden;
        /*display: flex;*/
        /*flex-direction: column;*/
        max-height: 100%;
    }

    .details-host :global(pre) {
        white-space: pre-wrap !important;
        font-family: monospace;
        line-height: 1.5;
        font-weight: 1000;
        font-size: 1.2em !important;
        background: none !important;
        max-width: 100%;
        overflow: hidden !important;
    }

    .results-host {
        flex-grow: 1;
        max-height: 0%;
        background: black;
    }

    .results-host.open {
        max-height: 30%;
        min-height: 30%;
        border-bottom: 2px white solid;
    }

    .results-host :global(.tr) {
        background: rgba(0,0,0,0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .results-host :global(.tr > div) {
        background: transparent !important;
    }

    .orand {
        font-size: 0.8em;
        box-sizing: border-box;
        padding: 2px 4px;
        background: rgba(0,0,0,0.7);
        border-bottom: 1px solid rgba(255,255,255,0.2);
        cursor: pointer;
    }

    .orand:hover span {
        background: rgba(255,255,255,0.1);
    }

    .orand span {
        color: #777;
        font-weight: 700;
        padding: 0.3em 0.2em;
        display: block;
        border-radius: 2px;
        min-width: 2.2em;
        text-align: center;
        user-select: none;
    }

    .orand span[and] {
        margin-bottom: 2px;
    }

    .orand span.s {
        background: #1AA1E7;
        color: white;
    }

    .two-editor {
        height: 50%;
    }

    .one-editor{
        height: 100%;
    }

    .raw-decode-btn{
        width: 80px !important;
    }
</style>