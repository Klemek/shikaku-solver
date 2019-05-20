/* exported app*/


let app = {
  el: '#app',
  data: {
    table: [],
    background: [],
    colors: {},
    sample: -1
  },
  methods: {
    processed: () => solver.processed,
    queue: () => solver.queue.length,
    getCell: v => /\d+/.test(v) && v !== 0 ? v : '',
    getStyle: function(x,y){
      const self = this;
      const v = self.background[x][y];

      if(/[A-Za-z]/.test(v))
        return {
        backgroundColor:self.colors[self.background[x][y]],
        border:'1px solid '+self.colors[self.background[x][y]]
      };
      return {
        border:'1px solid #424242'
      };
    },
    shuffle: function (a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    start: function(){
      const self = this;
      self.sample = (self.sample+1)%samples.length;
      let c = self.shuffle(colors);
      for(let i = 0; i < 26; i++){
        self.colors[String.fromCharCode(65+i)] = c[i];
        self.colors[String.fromCharCode(97+i)] = c[26+i];
      }
      self.table = solver.str2state(samples[self.sample].data);
      solver.start(self.table, function(state){
        self.background = state;
      }, function(states){
        self.background = states[0];
        setTimeout(self.start, 3000);
      });
    }
  },
  created: function () {

  },
  mounted: function () {
    const self = this;
    self.start();
  }
};