// supabase/functions/rss-feed-parser/index.ts
    
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Parser from 'https://esm.sh/rss-parser@3.13.0';

const parser = new Parser({
  customFields: { 
    item: [ 
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['image', 'image'], 
    ],
  }
});
    
serve(async (req: Request) => { 
    
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 
      },
    });
  }
    
  try {
    const { feedUrl } = await req.json(); 
    
    if (!feedUrl) { 
      return new Response(JSON.stringify({ error: 'feedUrl est requis' }), {
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', 
        },
      });
    }
    
    console.log(`Edge Function: Récupération du contenu XML depuis : ${feedUrl}`);
    // Étape 1: Récupérer le contenu XML du flux en utilisant fetch de Deno
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'SupabaseEdgeFunction/1.0 (RSS Parser)', // Certains serveurs RSS requièrent un User-Agent
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    });

    if (!response.ok) {
      throw new Error(`Échec de la récupération du flux RSS: ${response.status} ${response.statusText}`);
    }

    const xmlString = await response.text();
    console.log(`Edge Function: Contenu XML récupéré. Analyse en cours...`);

    // Étape 2: Analyser la chaîne XML avec rss-parser
    const feed = await parser.parseString(xmlString);
    console.log(`Edge Function: Flux RSS analysé avec succès : ${feed.title}`);
    
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate, 
      isoDate: item.isoDate, 
      creator: item.creator || item['dc:creator'], 
      contentSnippet: item.contentSnippet?.substring(0, 200) + '...' || item.summary?.substring(0, 200) + '...', 
      imageUrl: item.mediaContent?.$?.url ||       
                item.mediaThumbnail?.$?.url ||  
                item.enclosure?.url ||          
                item.image?.url ||              
                null,                           
      sourceTitle: feed.title, 
    })).slice(0, 20); 
    
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Erreur dans la fonction Edge rss-feed-parser:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erreur lors de la récupération ou de l\'analyse du flux RSS.' }), {
      status: 500, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
