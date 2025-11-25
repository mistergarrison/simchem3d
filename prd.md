

# Product Requirements Document (PRD)
## Project: MolNuSim (SimChem)

### 1. Executive Summary
**SimChem** is a production-grade, browser-based physics simulator designed to visualize the bridge between Molecular Chemistry and Nuclear Physics. Unlike static molecular editors, SimChem provides a continuous, real-time environment where atoms are subject to rigorous physical forces, chemical bonding rules, and probabilistic nuclear decay. It serves as an educational sandbox allowing users to observe femtosecond-scale molecular vibrations alongside billion-year-scale radioactive decay chains.

### 2. Core User Experience Goals
1.  **Scientific Fidelity:** The simulation must adhere to VSEPR geometry, Valency rules, and IUPAC element data.
2.  **Hybrid Time-Scaling:** Users must be able to observe immediate chemical reactions (real-time) and long-term nuclear decay (accelerated time) within the same session.
3.  **Adaptive Interaction:** The interface must provide distinct, optimized control schemes for both Mouse/Keyboard (Desktop) and Touch (Mobile/Tablet) inputs.
4.  **Tactile Physics:** Interactions (dragging, throwing) must feel responsive and weighty. Momentum must be conserved when users release atoms.

---

### 3. Simulation Requirements (The Physics Engine)

The core simulation loop runs independently of the UI thread, utilizing a **Force Accumulation** architecture integrated via Semi-Implicit (Symplectic) Euler. This ensures long-term stability, conservation of momentum, and prevents "ghost forces" that cause stationary molecules to drift or spin.

#### 3.1. Physics Pipeline
The update loop executes the following stages per sub-step:
1.  **Clear Forces**: Reset force accumulators ($F_x, F_y, F_z$) for all atoms to zero.
2.  **Continuous Forces (Accumulation)**:
    *   **VSEPR**: Calculates angular restoration forces to enforce geometry (Linear, Trigonal, Tetrahedral).
    *   **Electrostatics**: Coulomb forces ($F = k \frac{q_1 q_2}{r^2}$) applied symmetrically to charged particles.
    *   **Pauli Repulsion**: Short-range penalty forces preventing atom overlap.
    *   **Covalent Bonds**: Spring-damper systems ($F = -kx - cv$) modeling bond vibration.
    *   *Constraint:* All forces in this stage must be applied equally and oppositely to interacting pairs to strict enforcement of Newton's 3rd Law.
3.  **Discrete Events (Annealing & Reactions)**:
    *   **Reactions**: High-energy collisions triggering bond formation or breaking.
    *   **Annealing**: Topology corrections (e.g., shedding excess bonds) apply discrete velocity impulses ensuring Center of Mass stability.
4.  **Integration**:
    *   Update Velocity: $V_{new} = V_{old} + (F_{acc} / m) \cdot \Delta t$
    *   **Thermal Stabilization (Cooldown):** Newly synthesized atoms utilize a temporary "Shock Absorber" drag coefficient (decaying over ~0.5s) to damp high-energy forces from teleportation/layout snapping.
    *   Update Position: $P_{new} = P_{old} + V_{new} \cdot \Delta t$

#### 3.2. Molecular Geometry (VSEPR Implementation)
To prevent "floppy" molecules, the engine enforces angular constraints based on Valence Shell Electron Pair Repulsion theory.
*   **Scope:** Applied to covalent non-metals (Groups 13-18 + H).
*   **Domain Calculation:** Geometry is determined by steric number (Bonds + Lone Pairs).
*   **Force Application:**
    *   Calculates the dot product (cosine) between adjacent bond vectors.
    *   Compares against ideal angles (e.g., 109.5° for Tetrahedral).
    *   Applies orthogonal restoration forces to push atoms toward the ideal angle.
*   **Geometries Enforced:**
    *   **Linear:** 2 Domains (180°), e.g., $CO_2$.
    *   **Trigonal Planar:** 3 Domains (120°), e.g., $BF_3$.
    *   **Tetrahedral:** 4 Domains (109.5° projected to 2D/3D), e.g., $CH_4$.
    *   **Bent:** 3 Domains (<120°) or 4 Domains (<109.5°), e.g., $H_2O$.

#### 3.3. Chemistry Engine (Reactions & Annealing)
The engine acts as a "Heuristic Chemist," actively correcting user input and facilitating reactions.
*   **Bonding Rules:**
    *   **Bond Order:** Supports Single, Double, and Triple bonds based on electron sharing.
    *   **Elastic Limit:** Bonds snap if stretched beyond **5x** the rest length.
*   **Annealing (Error Correction):** The system automatically optimizes structures:
    *   **Smart Shedding:** If an atom exceeds its valency, it ejects the least structurally significant bond. The ejection force is balanced to prevent the parent molecule from recoiling wildly.
    *   **Homonuclear Cleanup:** Atoms bonded to their own type (e.g., $O-O$) will preferentially migrate to a nearby "Better Hub" (e.g., $C$) if available.
*   **Molecular Synthesis (The "Super Crunch"):**
    *   **Gravity Well:** Atoms pulled into a high-density zone (via Lasso or Recipe Spawn) are compressed.
    *   **Speed:** The assembly process is tuned to **1.5 seconds (90 frames)** for snappy responsiveness.
    *   **Graph Layout:** Before physics takes over, the engine solves a mini-simulation to determine valid topological positions, reducing explosive overlap.

#### 3.4. Nuclear Physics (Decay)
*   **Data Source:** Each atom tracks its specific isotope (Mass, Half-Life, Decay Mode).
*   **Probabilistic Model:** Decay occurs based on $P = 1 - 2^{-\Delta t / HL}$.
*   **Decay Modes:**
    *   **Alpha:** Emission of He-4 nucleus ($Z \rightarrow Z-2$). High recoil.
    *   **Beta:** Neutron-to-Proton conversion ($Z \rightarrow Z+1$). Low recoil.
    *   **Spontaneous Fission:** Atom splits or vanishes (simplified).
    *   **Neutron Capture:** Free neutrons can strike atoms to increase isotope mass ($A \rightarrow A+1$), potentially creating unstable isotopes.

---

### 4. Interface & Interaction Requirements

#### 4.1. Input Paradigms
*   **Desktop (Mouse):**
    *   **Drag & Drop:** Physical drag with spring constraints.
    *   **Subatomic Tools:** Dedicated tools to shoot Electrons/Protons/Neutrons.
    *   **Lasso:** Area selection to group atoms or trigger gravity wells.
*   **Mobile (Touch):**
    *   **Tap:** Spawn atom.
    *   **Long Press:** Open Isotope Selector.
    *   **Ghost Drag:** Vertical drag from palette spawns atom.
    *   **Overlay UI:** Controls float over canvas to maximize visibility.

#### 4.2. Visual Feedback
*   **Floating Labels:** 
    *   When a molecule is identified (e.g., "Water", "Ethanol"), a text label follows the group.
    *   **Lifecycle:** The label fades out naturally after a few seconds.
    *   **Instant Removal:** If a bond breaks or an atom is consumed by a new reaction, the label is removed **instantly** (0 frames) to prevent "ghosting" or misleading state information.
*   **View Modes:**
    *   **Solid:** Traditional sphere rendering with specular highlights.
    *   **Glass:** Translucent rendering showing internal volume and density gradients.
*   **Force Visualization:** Bonds stretch and change opacity based on stress (optional debug feature, currently visual only via length).

#### 4.3. Periodic Table & Palette
*   **Periodic Table:** Full 118-element support with IUPAC layout.
*   **Palette:**
    *   Customizable list of "Active" elements.
    *   Dropdown for Isotope selection (e.g., U-235 vs U-238).
    *   **Time Slider:** Logarithmic control from Real-time (1x) to Geologic Time (10,000x).

---

### 5. Technical Specifications

*   **Framework:** React 19.
*   **Rendering:** HTML5 `<canvas>` Context 2D.
*   **State Management:**
    *   **React:** UI State.
    *   **Refs (Mutable):** Physics World (Atoms array, Particles array) for high-performance (60fps) simulation loop without React reconciliation overhead.
*   **Performance:**
    *   **Sub-stepping:** 8 physics updates per render frame.
    *   **Spatial Optimization:** Pair-loops are optimized to $O(N^2/2)$ with distance checks.
    *   **Memory:** Zero-allocation patterns where possible in the hot loop (reusing vectors/objects implicitly via float math).
