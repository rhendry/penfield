Each editor in Fieldpen operates on a different types of assets. All assets for the PixelEditor, for example, must implement the PixelAsset interface. The editor knows how to render assets into the scene.

**Object graph.** The Pixel and Voxel editors take inspiration from game engines which organize content into trees of “objects” in a “scene”. However, they also take inspiration from traditional image editors in terms of layers and groups. Layers are super important.

**Tools.** When a toolbelt is equipped, it occupies the hotkeys as described in the high level design. When a specific tool in a toolbelt is equipped, it defines the behavior of the mouse actions as well as adds widgets to the editor that further customize/parameterize the tool. The user can also “sticky” widgets so they always stay in place even when the user switches to other tools. This creates a dynamic workspace that becomes naturally tuned to the task at hand.

**Tool Docs.** When `~` is pressed, all the tools in the toolbelt should have documentation listed along the lefthand side of the screen along with the hotkey for that tool. Clicking the documentation for a tool should expand it to a full modal where the tool can be discussed at length, demoed via gifs, etc.

### Pixel Editor

The pixel editor is a clickable grid. Some (not comprehensive) tools to include in a default toolkit:

- Pen
    - Assign right and left click colors
    - Includes color palette selector/builder
    - Hold shift to draw straight-edge line
- Eraser
- Select
- Fill
    - Includes color palette selector/builder as well*
    - Right click to “De-fill”
- Layers
- Reference image (to draw over top of)
- Preview window (zoomed out window so you get a more “natural” look at how small pixel art might look in-game)

*Some widgets are useful for many tools, such as the color palette selector/builder. These shouldn’t be re-implemented. If a color palette is “stickied” for the pen tool, then the user switches to the fill tool, they should be seeing and using the same exact widget.