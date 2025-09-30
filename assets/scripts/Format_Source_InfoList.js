let itemList = $input.all().map(item=>{
    return item.json
  })
  return {chatInput: itemList}