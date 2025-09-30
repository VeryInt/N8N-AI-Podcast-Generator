function getData(){
    // Loop over input items and add a new field called 'myNewField' to the JSON of each one
    let now = Date.now();
    let oneDay = 64800000; // 86400000;
    let allRequests = $input.all()
      // @ts-ignore
    let filterTweets = [];
    if(allRequests?.length > 0){
      allRequests.forEach(request=>{
          let tweets = request?.json?.data?.tweets;
  
          if(tweets?.length > 0){
          for (const item of tweets) {
            // @ts-ignore
            const { createdAt, url, text, quoted_tweet, extendedEntities, author } = item || {}
            // @ts-ignore
            let media = []
            if(extendedEntities?.media?.length > 0){
              extendedEntities.media.forEach(mediaItem=>{
                media.push({
                  mediaUrl: mediaItem?.media_url_https || null
                })
              })
            }
            const authorName = author?.name || author?.userName || ''
            let createdAtTime = new Date(createdAt).getTime() || 0
            if(createdAtTime + oneDay > now){
              filterTweets.push({
                author: authorName,
                createdAt: createdAt,
                url: url,
                fullText: text + (quoted_tweet?.text ? "\nquoted_tweet:\n" + quoted_tweet.text : ""),
                media: media,
              })
            }
        }
    }
      })
    }
  
  
    return filterTweets
  }
  
  return getData()
  
  