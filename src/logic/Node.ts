export type NodeValue = number | null | "inf" | "-inf";

export class Node {
  pos: [number, number] = [0, 0];
  children: Node[] = [];
  value: number | null = null;
  pruned: boolean = false;
  step: number = 0;
  max: boolean = false;
  layer: number = 0;
  parent: Node | null = null;
  
  // Algorithm states
  childSearchDone: boolean = false;
  currentChildSearch: number = 0;
  alpha: number | null = null;
  beta: number | null = null;
  returnValue: number | null = null;

  static radius: number = 0;

  constructor(layer: number = 0, max: boolean = false, parent: Node | null = null) {
    this.layer = layer;
    this.max = max;
    this.parent = parent;
  }

  setPruned(): void {
    this.pruned = true;
    for (const child of this.children) {
      child.setPruned();
    }
  }

  serialize(): any {
    let val: any = this.value;
    if (this.value === Infinity) val = "inf";
    if (this.value === -Infinity) val = "-inf";

    return {
      value: val,
      max: this.max,
      layer: this.layer,
      children: this.children.map((child) => child.serialize()),
    };
  }

  static deserialize(data: any, parent: Node | null = null): Node {
    const node = new Node(data.layer, data.max, parent);
    let val = data.value;
    if (val === "inf") val = Infinity;
    else if (val === "-inf") val = -Infinity;

    node.value = val;
    node.children = (data.children || []).map((childData: any) =>
      Node.deserialize(childData, node)
    );
    return node;
  }

  minimax(useAlphaBeta: boolean): Node | null {
    if (this.step === 0) {
      this.childSearchDone = false;
      this.currentChildSearch = 0;
      if (this.children.length === 0) {
        if (this.parent) {
          this.parent.returnValue = this.value;
          return this.parent.minimax(useAlphaBeta);
        }
        return null;
      }
      this.value = this.max ? -Infinity : Infinity;
      this.step = 1;
    }

    if (this.step === 1) {
      if (this.currentChildSearch === this.children.length) {
        if (this.parent) {
          this.parent.returnValue = this.value;
          return this.parent.minimax(useAlphaBeta);
        }
        return null;
      }
      if (this.childSearchDone) {
        for (let i = this.currentChildSearch; i < this.children.length; i++) {
          this.children[i].setPruned();
        }
        this.currentChildSearch = this.children.length;
        return this;
      }
      const child = this.children[this.currentChildSearch];
      child.alpha = this.alpha;
      child.beta = this.beta;
      this.step = 2;
      return child;
    } else if (this.step === 2) {
      const childValue = this.returnValue;
      if (childValue !== null) {
        if (this.max) {
          this.value = Math.max(this.value as number, childValue);
          if (useAlphaBeta) {
            this.alpha = Math.max(this.alpha ?? -Infinity, childValue);
          }
        } else {
          this.value = Math.min(this.value as number, childValue);
          if (useAlphaBeta) {
            this.beta = Math.min(this.beta ?? Infinity, childValue);
          }
        }
      }
      
      if (useAlphaBeta && this.alpha !== null && this.beta !== null && this.beta <= this.alpha) {
        this.childSearchDone = true;
      }
      
      this.currentChildSearch += 1;
      this.step = 1;
      return this;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, useAlphaBeta: boolean, isSelected: boolean): void {
    // Draw edges first
    for (const node of this.children) {
      ctx.lineWidth = Math.max(1, Node.radius / 15);
      ctx.strokeStyle = node.pruned ? "#bbbbbb" : "#000000";
      ctx.beginPath();
      ctx.moveTo(this.pos[0], this.pos[1] + Node.radius - 1);
      ctx.lineTo(node.pos[0], node.pos[1] - Node.radius + 1);
      ctx.stroke();
      node.draw(ctx, useAlphaBeta, false); // Only the root call handles selection for its node
    }

    // Node body
    ctx.font = `${Node.radius}px Helvetica`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], Node.radius, 0, 2 * Math.PI);

    if (this.pruned) {
      ctx.fillStyle = "#9e9e9e";
      ctx.strokeStyle = "#757575";
    } else if (this.max) {
      ctx.fillStyle = "#28a745";
      ctx.strokeStyle = "#1e7e34";
    } else {
      ctx.fillStyle = "#dc3545";
      ctx.strokeStyle = "#bd2130";
    }

    ctx.fill();
    ctx.lineWidth = Math.max(1, Node.radius / 10);
    if (isSelected) {
      ctx.strokeStyle = "#ffc107"; // Yellow selection highlight
      ctx.lineWidth = Math.max(2, Node.radius / 5);
    }
    ctx.stroke();

    // Value text
    ctx.fillStyle = "#ffffff";
    if (this.value !== null) {
      let valueText = this.value.toString();
      if (this.value === Infinity) valueText = "inf";
      if (this.value === -Infinity) valueText = "-inf";
      ctx.fillText(valueText, this.pos[0], this.pos[1] + Node.radius / 15);
    }

    // Alpha/Beta text
    if (useAlphaBeta && !this.pruned && this.children.length > 0) {
      ctx.font = `bold ${Node.radius / 1.8}px Helvetica`;
      ctx.fillStyle = "#0000ff";
      
      const alphaText = `α: ${this.alpha === Infinity ? "Inf" : (this.alpha === -Infinity ? "-Inf" : (this.alpha ?? ""))}`;
      const betaText = `β: ${this.beta === Infinity ? "Inf" : (this.beta === -Infinity ? "-Inf" : (this.beta ?? ""))}`;
      
      ctx.fillText(alphaText, this.pos[0], this.pos[1] - Node.radius * 2.5);
      ctx.fillText(betaText, this.pos[0], this.pos[1] - Node.radius * 1.8);
    }
  }

  getNodeAtPosition(x: number, y: number): Node | null {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const childResult = this.children[i].getNodeAtPosition(x, y);
      if (childResult) return childResult;
    }

    const dx = x - this.pos[0];
    const dy = y - this.pos[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= Node.radius * 1.2) {
      return this;
    }
    return null;
  }
}
