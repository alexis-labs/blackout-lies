Put the looping background music for the game in this folder.

Expected file:

```text
public/assets/music/background-loop.mp3
```

The game loads it from:

```text
/assets/music/background-loop.mp3
```

Replace or add that MP3 file and the game will request it as soon as the start
menu opens, then keep it looping into the interrogation. Browser autoplay rules
can still delay playback until the first player action.
