import { getAllPosts } from "@/lib/writing";
import Terminal from "./terminal";

export default function Home() {
  return <Terminal posts={getAllPosts()} />;
}
