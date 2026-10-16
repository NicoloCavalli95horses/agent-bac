//===================
// Import
//===================
import { log } from "../utils/utils.js";



//===================
// Class
//===================
export class Tracker {
  constructor(context) {
    this.page = context.page;
    this.eventBus = context.eventBus;

    this.unsubscribe = undefined;
    this.events = [];
  }



  async init() {
    // Listen to page events
    this.unsubscribe = this.eventBus.subscribe(event => {
      if (event.type.toUpperCase() === "CLICK") {
        this.events.push(event);
      }
    });

    log(`[Tracker] Successfully initialized`);
  }



  getEvents() {
    return [...this.events];
  }



  // ==============================
  // Utils
  // ==============================
  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.events = [];
  }
}