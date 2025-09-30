// let allItems = $input.all()
// return [{
//   "output": allItems[0].json.output
// }]

function stringifySpeakerContent(){
    let speakerContents = ''
    try{
      let allItems = $input.all()
      allItems.forEach(theItem=>{
        let outputString = theItem.json.output
        // speakerContents += outputString
        if(outputString){
          outputString = outputString.replace(/\n/g, '');
          const outputJson = JSON.parse(outputString)
          outputJson.map((item, index)=>{
            const indexValue = index % 2 + 1
            //@ts-ignore
            speakerContents += "[S" + indexValue +  "]" + item.content;
          })
        }
      })
    }
    catch(e){
      speakerContents = ""
    }
  
    return [{
      "output":speakerContents
    }]
  }
  
  return stringifySpeakerContent()