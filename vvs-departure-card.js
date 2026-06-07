/**
 * VVS Departure Card
 * Custom Lovelace card for VVS Departures integration
 */

const VERSION = "1.0.0";

// ─── EDITOR ──────────────────────────────────────────────────────────────────

class VVSDepartureCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = { ...config };
    this.render();
  }

  _fireChange() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: this._config },
    }));
  }

  _val(key, fallback = "") {
    return this._config[key] ?? fallback;
  }

  _entityOptions() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter((s) => {
        const a = s.attributes;
        return a.hasOwnProperty("delay_minutes") && a.hasOwnProperty("minutes_until");
      })
      .sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  }

  render() {
    const entities = this._entityOptions();
    const currentEntities = this._val("entities", []);
    const showNotices = this._val("show_notices", true);
    const noticePriorities = this._val("notice_priorities", ["veryHigh", "high", "normal", "low"]);

    const priorityOptions = [
      { value: "veryHigh", label: "Sehr hoch" },
      { value: "high",     label: "Hoch" },
      { value: "normal",   label: "Normal" },
      { value: "low",      label: "Niedrig" },
    ];

    const entityRows = entities.map((s) => {
      const checked = currentEntities.includes(s.entity_id);
      const fn = s.attributes.friendly_name || s.entity_id;
      return `<label class="entity-row">
        <input type="checkbox" data-entity="${s.entity_id}" ${checked ? "checked" : ""}>
        <span class="entity-name">${fn}</span>
      </label>`;
    }).join("");

    const priorityRows = priorityOptions.map((p) => {
      const checked = noticePriorities.includes(p.value);
      return `<label class="priority-row">
        <input type="checkbox" data-priority="${p.value}" ${checked ? "checked" : ""} ${!showNotices ? "disabled" : ""}>
        <span>${p.label}</span>
      </label>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 4px 0; }
        .section {
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .field {
          margin-bottom: 10px;
        }
        .field label {
          display: block;
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        input[type="text"], input[type="number"] {
          width: 100%;
          box-sizing: border-box;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .entity-list {
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
        }
        .entity-row, .priority-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-bottom: 1px solid var(--divider-color);
          cursor: pointer;
          font-size: 13px;
        }
        .entity-row:last-child, .priority-row:last-child {
          border-bottom: none;
        }
        .entity-row:hover, .priority-row:hover {
          background: var(--secondary-background-color);
        }
        .entity-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
        }
        .toggle-label {
          font-size: 14px;
          color: var(--primary-text-color);
        }
        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          accent-color: var(--primary-color);
        }
        .priority-list {
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          margin-top: 8px;
          opacity: ${showNotices ? "1" : "0.4"};
          pointer-events: ${showNotices ? "auto" : "none"};
        }
        .hint {
          font-size: 11px;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
      </style>

      <div class="section">
        <div class="section-title">Allgemein</div>
        <div class="field">
          <label>Titel (optional)</label>
          <input type="text" id="title" value="${this._val("title")}" placeholder="z.B. Renningen, Renningen">
        </div>
        <div class="field">
          <label>Max. Abfahrten</label>
          <input type="number" id="max_departures" value="${this._val("max_departures", 4)}" min="1" max="10">
        </div>
      </div>

      <div class="section">
        <div class="section-title">Sensoren</div>
        <div class="hint" style="margin-bottom:6px">Wähle die Abfahrts-Sensoren für diese Karte</div>
        <div class="entity-list">
          ${entityRows || '<div style="padding:10px;color:var(--secondary-text-color);font-size:13px">Keine VVS-Sensoren gefunden</div>'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Störungsmeldungen</div>
        <div class="toggle-row">
          <span class="toggle-label">Meldungen anzeigen</span>
          <input type="checkbox" id="show_notices" ${showNotices ? "checked" : ""}>
        </div>
        <div class="priority-list">
          ${priorityRows}
        </div>
        <div class="hint">Welche Prioritäten sollen angezeigt werden?</div>
      </div>
    `;

    // Title
    this.shadowRoot.getElementById("title").addEventListener("change", (e) => {
      this._config = { ...this._config, title: e.target.value };
      this._fireChange();
    });

    // Max departures
    this.shadowRoot.getElementById("max_departures").addEventListener("change", (e) => {
      this._config = { ...this._config, max_departures: parseInt(e.target.value) || 4 };
      this._fireChange();
    });

    // Entity checkboxes
    this.shadowRoot.querySelectorAll("input[data-entity]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const all = [...this.shadowRoot.querySelectorAll("input[data-entity]")]
          .filter((c) => c.checked)
          .map((c) => c.dataset.entity);
        this._config = { ...this._config, entities: all, device_id: undefined };
        this._fireChange();
      });
    });

    // Show notices toggle
    this.shadowRoot.getElementById("show_notices").addEventListener("change", (e) => {
      this._config = { ...this._config, show_notices: e.target.checked };
      this._fireChange();
      this.render();
    });

    // Priority checkboxes
    this.shadowRoot.querySelectorAll("input[data-priority]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const selected = [...this.shadowRoot.querySelectorAll("input[data-priority]")]
          .filter((c) => c.checked)
          .map((c) => c.dataset.priority);
        this._config = { ...this._config, notice_priorities: selected };
        this._fireChange();
      });
    });
  }
}

customElements.define("vvs-departure-card-editor", VVSDepartureCardEditor);


// ─── CARD ─────────────────────────────────────────────────────────────────────

class VVSDepartureCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._entities = [];
  }

  setConfig(config) {
    if (!config.device_id && (!config.entities || config.entities.length === 0)) {
      // Allow empty config during editor setup - just don't render data
    }
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateEntities();
    this.render();
  }

  _updateEntities() {
    if (!this._hass || !this._config) return;

    if (this._config.entities) {
      this._entities = this._config.entities
        .map((e) => this._hass.states[e])
        .filter(Boolean);
      return;
    }

    if (this._config.device_id) {
      const deviceId = this._config.device_id;
      this._entities = Object.values(this._hass.states).filter((state) => {
        const entityReg = this._hass.entities?.[state.entity_id];
        if (!entityReg) return false;
        if (entityReg.device_id !== deviceId) return false;
        const attrs = state.attributes;
        return attrs.hasOwnProperty("delay_minutes") && attrs.hasOwnProperty("minutes_until");
      });
      this._entities.sort((a, b) => {
        const ma = a.attributes.minutes_until ?? 999;
        const mb = b.attributes.minutes_until ?? 999;
        return ma - mb;
      });
    }
  }

  _minutesLabel(minutes) {
    if (minutes === null || minutes === undefined) return "—";
    if (minutes < 0) return "Verpasst";
    if (minutes === 0) return "Jetzt";
    if (minutes === 1) return "In 1 Min";
    if (minutes > 120) return "Später";
    return `In ${minutes} Min`;
  }

  _iconColor(delay, state) {
    if (state === "unknown" || state === "unavailable") return "var(--disabled-color)";
    if (delay >= 10) return "var(--error-color)";
    if (delay >= 3) return "var(--warning-color)";
    return "var(--success-color)";
  }

  _motIcon(lineFull, line) {
    // Mirror MOT detection from api.py _mot_from_line_full()
    const p = (lineFull || "").toLowerCase().trim();
    const l = (line || "").trim();
    if (["schiff", "fähre", "fahre", "katamaran", "ferry"].some(k => p.includes(k)))
      return "mdi:ferry";
    if (p.startsWith("s-bahn") || p.startsWith("sbahn"))
      return "mdi:train-variant";
    if (p.startsWith("u-bahn") || p.startsWith("ubahn"))
      return "mdi:subway-variant";
    if (p.startsWith("stadtbahn"))
      return "mdi:tram";
    if (p.startsWith("straßenbahn") || p.startsWith("strassenbahn") || p.startsWith("tram"))
      return "mdi:tram";
    if (p.startsWith("nachtbus") || p.startsWith("nacht-bus"))
      return "mdi:bus-clock";
    if (p.startsWith("schnellbus") || p.startsWith("expressbus"))
      return "mdi:bus-express";
    if (p.startsWith("bus"))
      return "mdi:bus";
    if (["zug", "ice", "rb", "re ", "mex"].some(k => p.includes(k)))
      return "mdi:train";
    if (p.startsWith("seilbahn") || p.startsWith("luftseil"))
      return "mdi:gondola";
    if (l.match(/^S\d+$/)) return "mdi:train-variant";
    if (l.match(/^U\d+$/)) return "mdi:subway-variant";
    return "mdi:transit-connection-variant";
  }

  _stopName() {
    if (this._config.title) return this._config.title;
    if (this._entities.length === 0) return "VVS Abfahrten";
    const fn = this._entities[0].attributes.friendly_name || "";
    const line = this._entities[0].attributes.line || "";
    const idx = fn.indexOf(line);
    if (idx > 0) return fn.substring(0, idx).trim();
    return fn;
  }

  _platformLabel(platform) {
    if (!platform) return "";
    if (platform.toLowerCase().includes("gleis")) return platform;
    return `Gl. ${platform}`;
  }

  _filterNotices(notices) {
    const showNotices = this._config.show_notices !== false;
    if (!showNotices) return [];
    const priorities = this._config.notice_priorities || ["veryHigh", "high", "normal", "low"];
    return notices.filter((n) => priorities.includes(n.priority));
  }

  render() {
    if (!this._hass || !this._config) return;

    const stopName = this._stopName();
    const maxRows = this._config.max_departures || 99;
    const entities = this._entities
      .filter((s) => s.state !== "unknown" && s.state !== "unavailable")
      .slice(0, maxRows);

    const items = entities.map((state) => {
      if (state.state === "unknown" || state.state === "unavailable") {
        return `<div class="departure-item">
          <div class="departure-row">
            <ha-icon icon="mdi:transit-connection-variant" style="color:var(--disabled-color)"></ha-icon>
            <span class="line-dest unavailable-text">Nicht verfügbar</span>
          </div>
        </div>`;
      }

      const attrs = state.attributes;
      const delay = attrs.delay_minutes ?? 0;
      const minutes = attrs.minutes_until ?? -1;
      const line = attrs.line || "?";
      const dest = attrs.destination || "?";
      const platform = this._platformLabel(attrs.platform || "");
      const realtime = attrs.realtime || false;
      const notices = this._filterNotices(attrs.notices || []);
      const iconColor = this._iconColor(delay, state.state);
      const timeStr = this._minutesLabel(minutes);
      const delayStr = delay > 0 ? `<span class="delay-label">+${delay} Min</span>` : "";
      const realtimeStr = !realtime ? `<span class="no-realtime">~</span>` : "";
      const platformStr = platform ? `<span class="platform">${platform}</span>` : "";

      const noticeItems = notices.map((n) => `
        <div class="notice-item">
          <ha-icon icon="mdi:alert-circle-outline" class="notice-icon"></ha-icon>
          <span class="notice-title">${n.title}</span>
        </div>`).join("");

      return `
        <div class="departure-item" data-entity="${state.entity_id}">
          <div class="departure-row">
            <ha-icon icon="${this._motIcon(attrs.line_full, attrs.line)}" style="color:${iconColor}"></ha-icon>
            <span class="line-dest">
              <span class="line-name">${line}</span>
              <span class="arrow">→</span>
              <span class="destination">${dest}</span>
            </span>
            <span class="time-info">
              <span class="time-label">${timeStr}</span>
              ${delayStr}${realtimeStr}
            </span>
            ${platformStr}
          </div>
          ${noticeItems ? `<div class="notices">${noticeItems}</div>` : ""}
        </div>`;
    }).join("");

    const noData = entities.length === 0
      ? `<div class="no-data">Keine Abfahrten verfügbar</div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 0; overflow: hidden; }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--secondary-text-color);
          border-bottom: 1px solid var(--divider-color);
        }
        .card-header ha-icon {
          --mdc-icon-size: 16px;
          color: var(--secondary-text-color);
        }

        .departure-item {
          border-bottom: 1px solid var(--divider-color);
          cursor: pointer;
          transition: background 0.15s;
        }
        .departure-item:last-child { border-bottom: none; }
        .departure-item:hover { background: var(--secondary-background-color); }

        .departure-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
        }
        .departure-row ha-icon {
          --mdc-icon-size: 22px;
          flex-shrink: 0;
        }

        .line-dest {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .line-name { font-weight: 700; }
        .arrow { color: var(--secondary-text-color); margin: 0 2px; }

        .time-info {
          flex-shrink: 0;
          text-align: right;
          font-size: 13px;
          white-space: nowrap;
        }
        .time-label { font-weight: 500; }
        .delay-label {
          margin-left: 4px;
          color: var(--warning-color);
          font-size: 11px;
          font-weight: 600;
        }
        .no-realtime {
          margin-left: 2px;
          color: var(--secondary-text-color);
          font-size: 11px;
        }

        .platform {
          flex-shrink: 0;
          font-size: 11px;
          color: var(--secondary-text-color);
          background: var(--secondary-background-color);
          border-radius: 4px;
          padding: 2px 5px;
          white-space: nowrap;
          margin-left: 4px;
        }

        .notices {
          padding: 0 12px 8px 42px;
        }
        .notice-item {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          font-size: 12px;
          color: var(--secondary-text-color);
          opacity: 0.8;
          margin-bottom: 2px;
        }
        .notice-item:last-child { margin-bottom: 0; }
        .notice-icon {
          --mdc-icon-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .notice-title { line-height: 1.3; }

        .unavailable-text { color: var(--disabled-color); font-size: 13px; }
        .no-data {
          text-align: center;
          padding: 16px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
      </style>
      <ha-card>
        <div class="card-header">
          <ha-icon icon="mdi:bus-stop"></ha-icon>
          ${stopName}
        </div>
        <div class="departures">
          ${items}
          ${noData}
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".departure-item[data-entity]").forEach((el) => {
      el.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: el.dataset.entity },
        }));
      });
    });
  }

  getCardSize() {
    return Math.max(1, this._entities.length + 1);
  }

  static getConfigElement() {
    return document.createElement("vvs-departure-card-editor");
  }

  static getStubConfig() {
    return { entities: [], title: "", max_departures: 4, show_notices: true, notice_priorities: ["veryHigh", "high", "normal", "low"] };
  }
}

customElements.define("vvs-departure-card", VVSDepartureCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "vvs-departure-card",
  name: "VVS Departure Card",
  description: "Zeigt Abfahrten einer VVS-Haltestelle kompakt an",
  preview: false,
});

console.info(
  `%c VVS-DEPARTURE-CARD %c v${VERSION} `,
  "background:#1976D2;color:#fff;padding:2px 4px;border-radius:3px 0 0 3px;font-weight:bold",
  "background:#424242;color:#fff;padding:2px 4px;border-radius:0 3px 3px 0"
);
