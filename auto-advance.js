export function createAutoAdvance(schedule=setTimeout,cancel=clearTimeout){
  let timer=null,revision=0;
  function stop(){revision++;if(timer!==null)cancel(timer);timer=null;}
  function start(callback,delay=650){stop();const captured=revision;timer=schedule(()=>{if(captured!==revision)return;timer=null;callback();},delay);}
  return {start,stop};
}
