// StateManager.js
// This class is a layer between PageMonitor() and StateMachine()
// It instantiates a state machine class and orchestrates the callbacks to be executed for each state

//===================
// Import
//===================
import { EventBus } from "../utils/eventBus.js";
import { StateMachine } from "../utils/StateMachine.js";
import { PageAgentManager } from "./PageAgentManager.js";
import { Tracker } from "./Tracker.js";
import { TestGenerator } from "./TestGenerator.js";

import {
  apiGetTamperedHTTPevents,
  apiInitRun,
  apiSaveJSONStats,
  apiToggleProxyState,
} from "../utils/api.js";
import { config } from "../config.js";


//===================
// Class
//===================
export class StateManager {
  constructor() {
    this.stateMachine = new StateMachine();
    this.eventBus = new EventBus();
    this.context = {
      page: undefined,
      eventBus: this.eventBus,
    };
  }



  async updateBtnLabel(state) {
    await this.context.page.evaluate((state) => {
      window.__instrumentation__.setButtonState(state);
    }, state);
  }



  async init() {
    this.stateMachine.addState("idle", {
      onEnter: async () => {
        await this.updateBtnLabel(this.getState());
      },
      onExit: async () => {
        const domain = new URL(this.context.page.url()).hostname.replace(/^www\./, "");
        await apiInitRun(domain);
      },
    });

    this.stateMachine.addState("exploration", {
      onEnter: async (ctx) => {
        await this.updateBtnLabel(this.getState());
        this.agentHandler = new PageAgentManager(ctx);
        await this.agentHandler.start();
      },
      onExit: async () => {
        await apiToggleProxyState(true);
        await this.agentHandler.end();
      },
    });

    this.stateMachine.addState("evaluation", {
      onEnter: async (ctx) => {
        await this.updateBtnLabel(this.getState());
        this.tracker = new Tracker(ctx);
        await this.tracker.init();
        await this.agentHandler.next();
      },
      onExit: async () => {
        await apiToggleProxyState(false);
        const success = await this.agentHandler.end();
        await apiSaveJSONStats();

        if (success && config.generateE2E) {
          const clickEvents = this.tracker.getEvents();
          const httpEvents = await apiGetTamperedHTTPevents();
          const options = {
            initUrl: this.agentHandler.initialURL,
            viewport: await this.context.page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight}))
          }
          const testGen = new TestGenerator(clickEvents, httpEvents?.data, options);
          await testGen.generate();
        }

        this.tracker.dispose();
      },
    });

    this.stateMachine.setInitialState("idle");
  }



  setPage(page) {
    this.context.page = page;
  }



  async handleEvent(event) {
    if (event.type === "STATE_CHANGE_REQUEST") {
      return await this.handleStateChangeRequest();
    }

    return await this.eventBus.emit(event);
  }



  async handleStateChangeRequest() {
    const currState = this.getState();

    if (currState === "idle") {
      for (const state of ["exploration", "evaluation", "idle"]) {
        await this.stateMachine.transition(state, this.context);
      }
    }

    return currState;
  }



  getState() {
    return this.stateMachine.getState();
  }
}