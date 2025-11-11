/**
 * ConstellationInput - Handle touch and mouse input for constellation game
 * Manages star selection, connection drawing, and gesture recognition
 */

export class ConstellationInput {
  constructor(canvas, renderer) {
    this.canvas = canvas
    this.renderer = renderer

    // Input state
    this.isDrawing = false
    this.selectedStar = null
    this.currentPos = null

    // Callbacks (set by game logic)
    this.onStarSelected = null
    this.onConnectionComplete = null
    this.onConnectionCanceled = null

    // Bind event listeners
    this.initEventListeners()
  }

  /**
   * Initialize event listeners for both touch and mouse
   */
  initEventListeners() {
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })

    // Mouse events (for desktop testing)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  getCanvasCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault()

    const touch = event.touches[0]
    const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY)

    this.handleInputStart(pos.x, pos.y)
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    event.preventDefault()

    if (!this.isDrawing) return

    const touch = event.touches[0]
    const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY)

    this.handleInputMove(pos.x, pos.y)
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    event.preventDefault()

    if (!this.isDrawing) return

    // Check if touch ended on a star
    if (this.currentPos) {
      const star = this.renderer.getStarAtPosition(this.currentPos.x, this.currentPos.y)
      if (star && star.id !== this.selectedStar?.id) {
        this.handleInputEnd(star)
      } else {
        this.handleInputCancel()
      }
    } else {
      this.handleInputCancel()
    }
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(event) {
    const pos = this.getCanvasCoordinates(event.clientX, event.clientY)
    this.handleInputStart(pos.x, pos.y)
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(event) {
    const pos = this.getCanvasCoordinates(event.clientX, event.clientY)

    if (this.isDrawing) {
      this.handleInputMove(pos.x, pos.y)
    } else {
      // Handle hover state
      const star = this.renderer.getStarAtPosition(pos.x, pos.y)
      this.updateHoverState(star)
    }
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(event) {
    if (!this.isDrawing) return

    const pos = this.getCanvasCoordinates(event.clientX, event.clientY)
    const star = this.renderer.getStarAtPosition(pos.x, pos.y)

    if (star && star.id !== this.selectedStar?.id) {
      this.handleInputEnd(star)
    } else {
      this.handleInputCancel()
    }
  }

  /**
   * Handle mouse leaving canvas
   */
  handleMouseLeave() {
    if (this.isDrawing) {
      this.handleInputCancel()
    }
    this.updateHoverState(null)
  }

  /**
   * Handle input start (touch or mouse down)
   */
  handleInputStart(x, y) {
    const star = this.renderer.getStarAtPosition(x, y)

    if (star) {
      this.isDrawing = true
      this.selectedStar = star
      this.currentPos = { x, y }

      // Update visual state
      star.isSelected = true

      // Notify callback
      if (this.onStarSelected) {
        this.onStarSelected(star)
      }

      // Update renderer
      this.renderer.setCurrentConnection({
        from: star,
        to: { x, y }
      })
    }
  }

  /**
   * Handle input move (touch or mouse move while drawing)
   */
  handleInputMove(x, y) {
    this.currentPos = { x, y }

    // Update the line being drawn
    if (this.selectedStar) {
      this.renderer.setCurrentConnection({
        from: this.selectedStar,
        to: { x, y }
      })
    }

    // Check if hovering over a valid target star
    const star = this.renderer.getStarAtPosition(x, y)
    if (star && star.id !== this.selectedStar?.id) {
      // Visual feedback for valid connection target
      star.isHovered = true
    }
  }

  /**
   * Handle input end (touch or mouse up on a star)
   */
  handleInputEnd(targetStar) {
    if (!this.selectedStar) return

    // Create connection
    const connection = {
      from: this.selectedStar.id,
      to: targetStar.id
    }

    // Mark stars as connected
    this.selectedStar.isConnected = true
    targetStar.isConnected = true

    // Create particle effect
    this.renderer.createParticles(targetStar.x, targetStar.y, 8)

    // Notify callback
    if (this.onConnectionComplete) {
      this.onConnectionComplete(connection)
    }

    this.resetDrawingState()
  }

  /**
   * Handle input cancel (released without completing connection)
   */
  handleInputCancel() {
    if (this.selectedStar) {
      this.selectedStar.isSelected = false
    }

    if (this.onConnectionCanceled) {
      this.onConnectionCanceled()
    }

    this.resetDrawingState()
  }

  /**
   * Reset drawing state
   */
  resetDrawingState() {
    this.isDrawing = false
    this.selectedStar = null
    this.currentPos = null

    // Clear visual state
    this.renderer.setCurrentConnection(null)

    // Clear hover states
    if (this.renderer.stars) {
      this.renderer.stars.forEach(star => {
        star.isSelected = false
        star.isHovered = false
      })
    }
  }

  /**
   * Update hover state for a star
   */
  updateHoverState(hoveredStar) {
    if (!this.renderer.stars) return

    // Clear all hover states
    this.renderer.stars.forEach(star => {
      star.isHovered = false
    })

    // Set new hover state
    if (hoveredStar) {
      hoveredStar.isHovered = true
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)

    this.resetDrawingState()
  }
}
