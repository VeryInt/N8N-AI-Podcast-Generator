function formatHuggingfacePapers () {
    let theItems = []
    try{
      // @ts-ignore
      let items = $input.all()
  
      for(let i=0, l= items.length;i<l;i++ ){
        if(i<5){
          let item = items[i]
          theItems.push({
            // @ts-ignore
            author: item.json.author,
            url: item.json.url,
            fullText: item.json.abstract,
            createdAt: item.json.date_published,
            media: []
          })
        }
      }
      return theItems
    }catch{
      return []
    }
  }
  
  return formatHuggingfacePapers()