window.AliliNative = {
  init: async function() {
    if (window.Capacitor && window.Capacitor.Plugins) {
      this.Agent = window.Capacitor.Plugins.CapacitorNativeAgent;
      console.log('Native Agent Ready');
    }
  },
  haptic: function() {
    if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'Light' });
    }
  },
  runAgent: async function(task) {
    if (this.Agent) {
      try {
        return await this.Agent.execute({ task: task });
      } catch (e) {
        console.error('Agent Error:', e);
        return { error: e.message };
      }
    }
    return { error: 'Agent not available' };
  }
};
