# GLOW in dim rooms

GLOW now adapts to the camera image: a darker room produces a darker background, stronger color emission on the person, a brighter contour, and a wider halo. The selected color controls the effect; red matches the supplied reference. Facial and clothing shading remains visible. FLOW, SLASH, LAUNCH, and segmentation recognition are unchanged.

A 24×18 camera sample is read at most five times per second. Pixels with person-mask confidence above 0.2 are excluded. At least 24 background samples are required; otherwise the last estimate is retained. Background luminance above 0.24 keeps normal illumination, below 0.06 reaches full enhancement, with a smoothstep transition between those levels. Each subsequent reading moves 25% toward its target to prevent exposure flicker. Measurements remain local and are not stored or transmitted.

At full enhancement the background receives up to 82% darkening, scaled with the mask fade. WebGL adds 0.30 to the color emission base, increases its luminance response by 0.35, and boosts the 3/12/28-pixel contour/halo samples. Canvas fallback similarly strengthens emission and 9/22-pixel bloom, excluding the body interior from blurred bloom to preserve contrast. Without a mask, the original camera image is restored; camera-off illustration remains available.

Verification covers both WebGL and Canvas dim-room pixels, internal contrast, mirrored bright-room detail, smooth adaptation after lights switch off, camera permission/stop lifecycle, responsive preview, and fallback rendering. Real room testing is still necessary because webcam auto-exposure and low-light segmentation quality vary by device; a camera that exposes a dark room as bright can weaken the automatic enhancement.
