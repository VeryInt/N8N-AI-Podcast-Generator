let filterItems = [], now = Date.now()
// Loop over input items and add a new field called 'myNewField' to the JSON of each one
for (const item of $input.all()) {
  const { pubDate, contentSnippet, link, author } = item.json
  if(pubDate){
    const pubTime = new Date(pubDate).getTime() || 0
    if(pubTime+86400000 > now){
      filterItems.push({
        author,
        fullText: contentSnippet,
        createdAt: pubDate,
        url: link,
        media: []
      })
    }
    
  }
}
return filterItems;