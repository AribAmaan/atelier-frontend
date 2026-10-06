"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export default class HeroSceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The landing page deliberately degrades to its CSS-only treatment when
    // WebGL initialization or the post-processing stack fails.
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
