import { Component } from 'react';
export class ModeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    this.props.onFailure(error?.reloadArtwork ? 'This light could not open. Reload the artwork, or choose another mode.' : 'This light could not open. Try again, or choose another mode.', Boolean(error?.reloadArtwork));
  }
  render() { return this.state.failed ? null : this.props.children; }
}
