Put suspect-specific PNG assets in one folder per suspect.

Expected structure:

```text
public/assets/suspects/
  suspect-id/
    portrait.png
    background.png
```

Use these paths in the suspect profile:

```ts
portraitUrl: "/assets/suspects/suspect-id/portrait.png",
backgroundUrl: "/assets/suspects/suspect-id/background.png",
```

The checked-in PNGs are placeholders and can be replaced with final art using the same filenames.
