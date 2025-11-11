/**
 * ConstellationRenderer - Canvas-based renderer for constellation game
 * Handles drawing stars, connections, and animations
 */

export class ConstellationRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.isRunning = false
    this.animationId = null

    // Visual settings
    this.starColors = {
      default: '#ffffff',
      selected: '#4FC3F7',
      connected: '#81C784',
      hint: '#FFB74D'
    }

    this.starSizes = {
      // Size based on magnitude (brighter stars are larger)
      getBrightness: (magnitude) => {
        // Magnitude scale: lower = brighter
        // Map to size: 2-8px
        return Math.max(2, Math.min(8, 8 - magnitude))
      }
    }

    // Animation state
    this.particles = []
    this.pulsePhase = 0
    this.twinkleOffsets = new Map() // Store per-star twinkle timing offsets

    // Input state (managed externally but stored for rendering)
    this.selectedStar = null
    this.hoveredStar = null
    this.currentConnection = null // { from: star, to: {x, y} }
  }

  /**
   * Set canvas size (should match display size for crisp rendering)
   */
  setSize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
  }

  /**
   * Start the render loop
   */
  start() {
    this.isRunning = true
    this.gameLoop()
  }

  /**
   * Stop the render loop
   */
  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  /**
   * Main game loop
   */
  gameLoop = () => {
    if (!this.isRunning) return

    this.update()
    this.render()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  /**
   * Update animations and state
   */
  update() {
    this.pulsePhase = (this.pulsePhase + 0.02) % (Math.PI * 2)

    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= 0.016 // ~60fps
      p.y -= p.velocity
      p.opacity = p.life
      return p.life > 0
    })
  }

  /**
   * Render everything to canvas
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw in layers
    this.drawBackground()
    this.drawConnections()
    this.drawStars()
    this.drawCurrentConnection()
    this.drawParticles()
  }

  /**
   * Draw starfield background
   */
  drawBackground() {
    // Optional: draw faint background stars for atmosphere
    // Could be pre-rendered to offscreen canvas for performance
  }

  /**
   * Draw constellation connections (lines between stars)
   */
  drawConnections() {
    if (!this.stars || !this.connections) return

    this.ctx.strokeStyle = this.starColors.connected
    this.ctx.lineWidth = 2
    this.ctx.lineCap = 'round'

    this.connections.forEach(connection => {
      // Only draw connections that have been explicitly completed by the player
      if (!connection.completed) return

      const star1 = this.stars.find(s => s.id === connection.from)
      const star2 = this.stars.find(s => s.id === connection.to)

      if (star1 && star2) {
        this.ctx.globalAlpha = 0.8
        this.ctx.beginPath()
        this.ctx.moveTo(star1.x, star1.y)
        this.ctx.lineTo(star2.x, star2.y)
        this.ctx.stroke()
        this.ctx.globalAlpha = 1.0
      }
    })
  }

  /**
   * Draw the line being drawn by player
   */
  drawCurrentConnection() {
    if (!this.currentConnection) return

    const { from, to } = this.currentConnection

    this.ctx.strokeStyle = this.starColors.selected
    this.ctx.lineWidth = 2
    this.ctx.lineCap = 'round'
    this.ctx.globalAlpha = 0.6

    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()

    this.ctx.globalAlpha = 1.0
  }

  /**
   * Draw all stars
   */
  drawStars() {
    if (!this.stars) return

    this.stars.forEach(star => {
      this.drawStar(star)
    })
  }

  /**
   * Draw a single star
   */
  drawStar(star) {
    // Background stars are rendered very faintly and small
    if (star.isBackground) {
      const bgSize = 1.5
      this.ctx.globalAlpha = 0.15 // Very faint
      this.ctx.fillStyle = '#ffffff'
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, bgSize, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.globalAlpha = 1.0
      return // Skip all other rendering for background stars
    }

    // Calculate base size from magnitude (brighter stars = larger)
    let baseSize = star.magnitude !== undefined
      ? this.starSizes.getBrightness(star.magnitude)
      : 4

    // Add twinkle effect - each star gets a unique offset for more natural randomness
    if (!this.twinkleOffsets.has(star.id)) {
      this.twinkleOffsets.set(star.id, Math.random() * Math.PI * 2)
    }
    const twinkleOffset = this.twinkleOffsets.get(star.id)
    const twinkleSpeed = 0.8 + Math.random() * 0.4 // Vary speed slightly per star
    const twinkleIntensity = 0.15 + Math.random() * 0.15 // 15-30% variation
    const twinkle = 1 + Math.sin(this.pulsePhase * twinkleSpeed + twinkleOffset) * twinkleIntensity

    const size = baseSize * twinkle

    // Determine color based on state
    let color = this.starColors.default
    let glowSize = size * 1.5
    let opacity = 0.8 + twinkle * 0.2 // Stars pulse in opacity too

    if (star.isSelected) {
      color = this.starColors.selected
      glowSize = size * 2 + Math.sin(this.pulsePhase) * 2 // Pulsing effect
      opacity = 1.0
    } else if (star.isConnected) {
      color = this.starColors.connected
      glowSize = size * 1.5
      opacity = 1.0
    } else if (star.isHint) {
      color = this.starColors.hint
      glowSize = size * 2 + Math.sin(this.pulsePhase * 2) * 3 // Faster pulse for hints
      opacity = 1.0
    }

    // Draw glow with twinkle opacity
    this.ctx.globalAlpha = opacity
    const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, color + '80') // Semi-transparent
    gradient.addColorStop(1, color + '00') // Fully transparent

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2)
    this.ctx.fill()

    // Draw star core with enhanced brightness
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(star.x, star.y, size, 0, Math.PI * 2)
    this.ctx.fill()

    // Add subtle cross-flare for brighter stars (magnitude < 2)
    if (baseSize > 5 && !star.isSelected && !star.isConnected) {
      this.ctx.globalAlpha = opacity * 0.3
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 0.5
      const flareSize = size * 2.5

      // Vertical line
      this.ctx.beginPath()
      this.ctx.moveTo(star.x, star.y - flareSize)
      this.ctx.lineTo(star.x, star.y + flareSize)
      this.ctx.stroke()

      // Horizontal line
      this.ctx.beginPath()
      this.ctx.moveTo(star.x - flareSize, star.y)
      this.ctx.lineTo(star.x + flareSize, star.y)
      this.ctx.stroke()
    }

    this.ctx.globalAlpha = 1.0

    // Draw star name if selected or hovered
    if ((star.isSelected || star.isHovered) && star.name) {
      this.drawStarLabel(star)
    }
  }

  /**
   * Draw star label
   */
  drawStarLabel(star) {
    this.ctx.font = '12px sans-serif'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'bottom'

    // Draw text with subtle shadow for readability
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    this.ctx.shadowBlur = 4
    this.ctx.fillText(star.name, star.x, star.y - 12)
    this.ctx.shadowBlur = 0
  }

  /**
   * Draw particle effects
   */
  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  /**
   * Create particle effect at position
   */
  createParticles(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        size: Math.random() * 2 + 1,
        velocity: Math.random() * 2 + 1,
        opacity: 1,
        life: 1
      })
    }
  }

  /**
   * Update star data for rendering
   */
  setStars(stars) {
    this.stars = stars
  }

  /**
   * Update connection data
   */
  setConnections(connections) {
    this.connections = connections
  }

  /**
   * Set current drawing connection
   */
  setCurrentConnection(connection) {
    this.currentConnection = connection
  }

  /**
   * Get star at position (for hit detection)
   */
  getStarAtPosition(x, y) {
    if (!this.stars) return null

    // Check in reverse order (top stars first)
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i]

      // Skip background stars - they're not interactive
      if (star.isBackground) continue

      const size = star.magnitude !== undefined
        ? this.starSizes.getBrightness(star.magnitude)
        : 4

      const hitRadius = Math.max(size * 2, 20) // Minimum 20px tap target
      const dx = x - star.x
      const dy = y - star.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= hitRadius) {
        return star
      }
    }

    return null
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop()
    this.stars = null
    this.connections = null
    this.particles = []
  }
}
