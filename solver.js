/* exported solver, samples */

const solver = (function(){

  const print = state => state.map(x => x.map(y => y ? ('  ' + y).slice(-2) : ' .').join(' ')).join('\n');
  const completion = state => state.map(x => x.join('')).join('').replace(/[^A-Za-z]/gm,'').length;
  const clone = state => new Array(state.length).fill(0).map((x, i) => state[i].slice(0));
  const nextLetter = letter => !letter ? 'A' : (letter === 'Z' ? 'a' : String.fromCharCode(letter.charCodeAt(0) + 1));
  const sumOfSpace = (s,x,dx,y,dy) =>
    s.filter((i,k) => k >= x && k <= x+dx)
      .map(i =>
        i.filter((j,k) => k >= y && k <= y+dy)
          .reduce((s,k) => s+k, 0))
      .reduce((s,k) => s+k, 0);

  const debugSpace = function(s, space) {
    const c = clone(s);

    const mix = space.x;
    const max = space.x+space.dx;
    const miy = space.y;
    const may = space.y+space.dy;

    console.log(`x:${mix}->${max} | y:${miy}->${may} | area:${space.a}`);

    c[mix][miy] = c[mix][miy] || '┌';
    c[mix][may] = c[mix][may] || '┐';
    c[max][miy] = c[max][miy] || '└';
    c[max][may] = c[max][may] || '┘';

    console.log(print(c));
  };

  const findSpaces = function(s,x0,y0) {
    const W = s.length;
    const H = s[0].length;
    const s2 = clone(s);
    let target = s2[x0][y0];
    s2[x0][y0] = 0;
    let spaces = [];
    for (let x = 0; x < W; x++)
      for (let y = 0; y < H; y++)
        if(!s2[x][y]){
          for(let dx = 0; dx < W-x; dx++){
            const max = Math.min(Math.ceil(target/dx),H-y);
            for(let dy = 0; dy < max; dy++){
              if(x <= x0 && x+dx >= x0 && y <= y0 && y+dy >= y0 && (dx+1)*(dy+1) === target){
                if(sumOfSpace(s2,x,dx,y,dy) === 0){
                  let tmp = { x:x, y:y,
                    dx:dx, dy:dy,
                    a:(dx+1)*(dy+1) };
                  spaces.push(tmp);
                }
              }
            }
          }
        }
    return spaces;
  };

  const shuffle = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let self = {
    solved:[],
    processed:0,
    queue:[],
    finishOnFirst:true,
    str2state:function(str){
      return str.split('\n').map(line => line.split(' ').map(x => parseInt(x)));
    },
    start:function(state0, workingCallback, finishedCallback){
      self.solved = [];
      self.processed = 0;
      self.queue = [state0];
      self.workingCallback = workingCallback;
      self.finishedCallback = finishedCallback;

      setTimeout(self.loop);
    },
    loop:function(){
      if(self.queue.length > 0){
        let state = self.queue.shift();
        if(self.process(state))
          self.workingCallback(state);
        self.processed++;
        setTimeout(self.loop);
      }else{
        self.finishedCallback(self.solved);
      }
    },
    process: function(s){
      const W = s.length;
      const H = s[0].length;
      let debug = self.processed === -1;
      if (debug)
        console.log('loop:' + self.processed + '\n' + print(s));
      let comp = completion(s);
      if (comp === W*H){
        if(self.finishOnFirst)
          self.queue = [];
        return self.solved.push(s);
      }


      let numbers = [];

      let maxLetter;
      let x,y;

      let stop = false;
      for (x = 0; x < W && !stop; x++) {
        for (y = 0; y < H && !stop; y++) {
          if (s[x][y]) {
            if(/\d+/.test(s[x][y])){
              numbers.push({
                m:s[x][y],
                x:x,
                y:y
              });
            }else if(!maxLetter || s[x][y] > maxLetter){
              maxLetter = s[x][y];
            }
          }else{ //empty cell
            const walls = [0,0,0,0];
            let number = false;
            for(let d = 1; d < Math.max(W,H); d++){
              if(!walls[0] && x-d >= 0 && s[x-d][y]){
                walls[0] = d;
                if(/\d+/.test(s[x-d][y])) {
                  number = true;
                  break;
                }
              }
              if(!walls[1] && x+d < W && s[x+d][y]){
                walls[1] = d;
                if(/\d+/.test(s[x+d][y])) {
                  number = true;
                  break;
                }
              }
              if(!walls[2] && y+d >= 0 && s[x][y-d]){
                walls[2] = d;
                if(/\d+/.test(s[x][y-d])) {
                  number = true;
                  break;
                }
              }
              if(!walls[3] && y+d < H && s[x][y+d]){
                walls[3] = d;
                if(/\d+/.test(s[x][y+d])) {
                  number = true;
                  break;
                }
              }
            }
            if(!number && walls.filter(x => x === 1).length >= 3){
              stop = true;
            }
          }
        }
      }

      if(stop)
        return true;

      const letter = nextLetter(maxLetter);
      if (debug)
        console.log(maxLetter, letter);

      for(let i = 0; i < numbers.length; i++){
        numbers[i].spaces = findSpaces(s, numbers[i].x, numbers[i].y);
        numbers[i].p = numbers[i].spaces.length;
        if(numbers[i].p === 0)
          return false;
      }

      numbers = numbers.sort((a,b) => a.p-b.p);

      if(numbers.length > 0){
        let target = numbers[0].p;
        numbers = shuffle(numbers.filter(x => x.p === target));
        if(debug)
          console.log(numbers[0].x,numbers[0].y,numbers[0].m, numbers[0].p);
        numbers[0].spaces.forEach(function(space){
          if(debug)
            debugSpace(s,space);
          const n = clone(s);
          for (x = space.x; x <= space.x+space.dx; x++) {
            for (y = space.y; y <= space.y+space.dy; y++) {
              n[x][y] = letter;
            }
          }
          self.queue.unshift(n);
        });
        if(self.processed.length%10 === 0)
          console.log('found:',self.solved.length,'processed:',self.processed.length, 'comp:', (100*comp/(W*H)).toFixed(2)+'%', 'queue:',self.queue.length,'+'+numbers[0].p);
      }
      return numbers.length > 0;
    }
  };

  return self;
})();