import { StoryboardEditor } from "@/components/storyboard/storyboard-editor"
import { listStoryboard } from "@/lib/storyboard-repo"

export default async function Page() {
  const storyboard = await listStoryboard()
  return <StoryboardEditor initialScenes={storyboard} />
}
