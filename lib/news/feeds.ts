export interface FeedConfig {
  name: string;
  url: string;
}

export const FEEDS: FeedConfig[] = [
  { name: "Pitchfork", url: "https://pitchfork.com/rss/news/feed.xml" },
  { name: "Stereogum", url: "https://www.stereogum.com/feed/" },
  { name: "The Guardian", url: "https://www.theguardian.com/music/rss" },
  { name: "NME", url: "https://www.nme.com/feed" },
  { name: "FACT Magazine", url: "https://www.factmag.com/feed/" },
  {
    name: "Consequence",
    url: "https://consequenceofsound.net/category/music/feed/",
  },
  { name: "Brooklyn Vegan", url: "https://www.brooklynvegan.com/feed/" },
  { name: "DIY", url: "https://diymag.com/feed" },
  {
    name: "Line of Best Fit",
    url: "https://www.thelineofbestfit.com/rss.xml",
  },
  { name: "Resident Advisor", url: "https://ra.co/xml/news.xml" },
];
