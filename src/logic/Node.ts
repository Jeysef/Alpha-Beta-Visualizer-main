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
  alphaHistory: number[] = [];
  betaHistory: number[] = [];
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

    let alphaVal: any = this.alpha;
    if (this.alpha === Infinity) alphaVal = "inf";
    if (this.alpha === -Infinity) alphaVal = "-inf";

    let betaVal: any = this.beta;
    if (this.beta === Infinity) betaVal = "inf";
    if (this.beta === -Infinity) betaVal = "-inf";

    let returnVal: any = this.returnValue;
    if (this.returnValue === Infinity) returnVal = "inf";
    if (this.returnValue === -Infinity) returnVal = "-inf";

    const serializeArray = (arr: number[]) => arr.map(v => {
      if (v === Infinity) return "inf";
      if (v === -Infinity) return "-inf";
      return v;
    });

    return {
      value: val,
      max: this.max,
      layer: this.layer,
      pruned: this.pruned,
      step: this.step,
      childSearchDone: this.childSearchDone,
      currentChildSearch: this.currentChildSearch,
      alpha: alphaVal,
      beta: betaVal,
      alphaHistory: serializeArray(this.alphaHistory),
      betaHistory: serializeArray(this.betaHistory),
      returnValue: returnVal,
      children: this.children.map((child) => child.serialize()),
    };
  }

  static deserialize(data: any, parent: Node | null = null): Node {
    const node = new Node(data.layer, data.max, parent);
    
    const parseVal = (v: any) => {
      if (v === "inf") return Infinity;
      if (v === "-inf") return -Infinity;
      return v;
    };

    node.value = parseVal(data.value);
    node.pruned = !!data.pruned;
    node.step = data.step || 0;
    node.childSearchDone = !!data.childSearchDone;
    node.currentChildSearch = data.currentChildSearch || 0;
    node.alpha = parseVal(data.alpha);
    node.beta = parseVal(data.beta);
    node.alphaHistory = (data.alphaHistory || []).map(parseVal);
    node.betaHistory = (data.betaHistory || []).map(parseVal);
    node.returnValue = parseVal(data.returnValue);

    node.children = (data.children || []).map((childData: any) =>
      Node.deserialize(childData, node)
    );
    return node;
  }

  minimax(useAlphaBeta: boolean): Node | null {
    if (this.step === 0) {
      this.childSearchDone = false;
      this.currentChildSearch = 0;
      if (this.alpha !== null) this.alphaHistory = [this.alpha];
      if (this.beta !== null) this.betaHistory = [this.beta];
      
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
          const prevVal = this.value as number;
          this.value = Math.max(prevVal, childValue);
          if (useAlphaBeta) {
            const prevAlpha = this.alpha ?? -Infinity;
            this.alpha = Math.max(prevAlpha, childValue);
            if (this.alpha !== prevAlpha) {
              this.alphaHistory.push(this.alpha);
            }
          }
        } else {
          const prevVal = this.value as number;
          this.value = Math.min(prevVal, childValue);
          if (useAlphaBeta) {
            const prevBeta = this.beta ?? Infinity;
            this.beta = Math.min(prevBeta, childValue);
            if (this.beta !== prevBeta) {
              this.betaHistory.push(this.beta);
            }
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

  draw(ctx: CanvasRenderingContext2D, useAlphaBeta: boolean, isSelected: boolean, showHistory: boolean): void {
    // Draw edges first
    for (const node of this.children) {
      ctx.lineWidth = Math.max(1, Node.radius / 15);
      ctx.strokeStyle = node.pruned ? "#bbbbbb" : "#000000";
      ctx.beginPath();
      ctx.moveTo(this.pos[0], this.pos[1] + Node.radius - 1);
      ctx.lineTo(node.pos[0], node.pos[1] - Node.radius + 1);
      ctx.stroke();
      node.draw(ctx, useAlphaBeta, false, showHistory); // Only the root call handles selection for its node
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
      const isInternal = this.children.length > 0;
      const hasStartedSearching = this.currentChildSearch > 0 || this.childSearchDone;
      const isInfinity = this.value === Infinity || this.value === -Infinity;
      
      // Don't show infinity on internal nodes if we haven't checked any children yet
      if (!isInternal || !isInfinity || hasStartedSearching) {
        let valueText = this.value.toString();
        if (this.value === Infinity) valueText = "inf";
        if (this.value === -Infinity) valueText = "-inf";
        ctx.fillText(valueText, this.pos[0], this.pos[1] + Node.radius / 15);
      }
    }

    // Alpha/Beta text
    if (useAlphaBeta && !this.pruned && this.children.length > 0) {
      ctx.font = `bold ${Node.radius / 1.8}px Helvetica`;
      ctx.fillStyle = "#0000ff";
      
      const formatVal = (v: number | null) => {
        if (v === Infinity) return "∞";
        if (v === -Infinity) return "-∞";
        return v?.toString() ?? "";
      };

      let alphaText: string;
      let betaText: string;

      if (showHistory) {
        alphaText = `α: [${this.alphaHistory.map(formatVal).join(", ")}]`;
        betaText = `β: [${this.betaHistory.map(formatVal).join(", ")}]`;
      } else {
        alphaText = `α: ${formatVal(this.alpha)}`;
        betaText = `β: ${formatVal(this.beta)}`;
      }
      
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
