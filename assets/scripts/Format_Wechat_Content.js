function formatContent(){
    let jsonInfo = {}
    try{
      for (const item of $input.all()) {
        let jsonInfoString = item?.json?.output;
        if(jsonInfoString){
          let jsonInfoObj = JSON.parse(jsonInfoString.replace(/\n/g, ''))
          jsonInfo = {
            ...jsonInfo,
            ...jsonInfoObj
          }
        }
      }
    }catch{
      
    }
    return jsonInfo
  }
  
  return formatContent();