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
];
