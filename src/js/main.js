const floorHeightInPx = getComputedStyle(
    document.querySelector("html")
  ).getPropertyValue("--floor-height");
  const floorHeight = parseInt(floorHeightInPx.slice(0, -2));
  let liftsCount, floorsCount;
  const liftsAvailability = new Map();
  const liftAt = new Map();
  const floorLiftMap = new Map();
  const pendingCalls = [];
  
  document.querySelector("button#submit").addEventListener("click", (event) => {
    event.preventDefault();
  
    const floorsInput = document.querySelector("#floors-input");
    const liftsInput = document.querySelector("#lifts-input");
    floorsCount = parseInt(floorsInput.value, 10);
    liftsCount = parseInt(liftsInput.value, 10);
  
    if (
      floorsCount <= 0 ||
      floorsCount > 100 ||
      liftsCount <= 0 ||
      liftsCount > 10
    ) {
      alert("Invalid input! Try again.");
      return;
    }
  
    const inputBox = document.querySelector("#input-box");
    inputBox.style.display = "none";
  
    const floorsCountContainer = document.querySelector("#floors-count");
    const liftsCountContainer = document.querySelector("#lifts-count");
    floorsCountContainer.textContent = `Floors count - ${floorsCount}`;
    liftsCountContainer.textContent = `Lifts count - ${liftsCount}`;
  
    renderFloors(floorsCount);
    renderLifts(liftsCount);
  });
  
  function handleLiftCall(event) {
    const calledFloor = event.target.closest(".floor");
    const floorId = calledFloor.id;
    if (floorLiftMap.get(floorId) != null) {
      const mappedLiftId = floorLiftMap.get(floorId);
      if (liftsAvailability.get(mappedLiftId)) {
        liftsAvailability.set(mappedLiftId, false);
        openAndCloseDoors(floorId, mappedLiftId);
      }
      return;
    }
    for (let liftNumber = 1; liftNumber <= liftsCount; liftNumber++) {
      const liftId = `lift-${liftNumber}`;
      if (liftsAvailability.get(liftId)) {
        moveLift(floorId, liftId);
        return;
      }
    }
  
    pendingCalls.push(floorId);
  }
  
  function moveLift(floorId, liftId) {
    if (floorLiftMap.get(floorId) != null) {
      const mappedLiftId = floorLiftMap.get(floorId);
      if (liftsAvailability.get(mappedLiftId)) {
        liftsAvailability.set(mappedLiftId, false);
        openAndCloseDoors(floorId, mappedLiftId);
      }
      return;
    }
  
    liftsAvailability.set(liftId, false);
    floorLiftMap.set(floorId, liftId);
    floorLiftMap.forEach((value, key) => {
      if (key !== floorId && value === liftId) {
        floorLiftMap.set(key, null);
      }
    });
  
    const floor = document.querySelector(`#${floorId}`);
    const lift = document.querySelector(`#${liftId}`);
    const arr = floorId.split("-");
    const floorNumber = parseInt(arr[arr.length - 1]);
  
    const prevFloor = liftAt.get(liftId);
    const direction = floorNumber > prevFloor ? "up" : "down";
  
    // Check for intermediate stops
    const intermediateStops = pendingCalls.filter((call) => {
      const callFloorNumber = parseInt(call.split("-")[1]);
      return direction === "up"
        ? callFloorNumber > prevFloor && callFloorNumber < floorNumber
        : callFloorNumber < prevFloor && callFloorNumber > floorNumber;
    });
  
    if (intermediateStops.length > 0) {
      const nextStop = intermediateStops.shift();
      pendingCalls.splice(pendingCalls.indexOf(nextStop), 1);
      moveLift(nextStop, liftId);
      return;
    }
  
    const diff = Math.abs(prevFloor - floorNumber);
    const transitionDuration = diff * 2;
  
    lift.style.transform = `translateY(-${floorNumber * floorHeight}px)`;
    lift.style.transition = `all ${transitionDuration}s`;
    setTimeout(() => {
      openAndCloseDoors(floorId, liftId);
      checkPendingCalls(liftId);
    }, transitionDuration * 1000);
  
    liftAt.set(liftId, floorNumber);
  }
  
  function openAndCloseDoors(floorId, liftId) {
    const lift = document.querySelector(`#${liftId}`);
    const leftDoor = lift.querySelector(".left-door");
    const rightDoor = lift.querySelector(".right-door");
    leftDoor.classList.add("left-move");
    rightDoor.classList.add("right-move");
    setTimeout(() => {
      leftDoor.classList.remove("left-move");
      rightDoor.classList.remove("right-move");
      setTimeout(() => {
        liftsAvailability.set(liftId, true);
        if (pendingCalls.length > 0) {
          const floorIdFromRemainingCalls = pendingCalls.shift();
          moveLift(floorIdFromRemainingCalls, liftId);
        }
      }, 2500);
    }, 2500);
  }
  
  function renderFloors(totalFloors) {
    const floorsContainer = document.querySelector("#floors-container");
    for (let floorNumber = totalFloors; floorNumber > 0; floorNumber--) {
      const currentFloor = document.createElement("section");
      currentFloor.className = "floor";
      const floorId = `floor-${floorNumber}`;
      currentFloor.id = floorId;
      currentFloor.innerHTML = `
              <section class="floor-details">
                  ${
                    floorNumber < totalFloors
                      ? '<button class="lift-control up">UP</button>'
                      : ""
                  }
                  <p class="floor-number">Floor-${floorNumber}</p> 
                  ${
                    floorNumber > 0
                      ? '<button class="lift-control down">DOWN</button>'
                      : ""
                  }
              </section>
          `;
      if (floorNumber < totalFloors) {
        currentFloor
          .querySelector(".up")
          .addEventListener("click", (event) => handleLiftCall(event));
      }
      if (floorNumber > 0) {
        currentFloor
          .querySelector(".down")
          .addEventListener("click", (event) => handleLiftCall(event));
      }
  
      floorsContainer.appendChild(currentFloor);
      floorLiftMap.set(floorId, null);
    }
    const groundFloor = document.createElement("section");
    groundFloor.className = "floor";
    groundFloor.id = `floor-0`;
    groundFloor.innerHTML = `
          <section class="floor-details">
              <button class="lift-control up">UP</button>
              <p class="floor-number">Floor-0</p> 
          </section>
      `;
    groundFloor
      .querySelector(".up")
      .addEventListener("click", (event) => handleLiftCall(event));
    floorsContainer.appendChild(groundFloor);
    floorLiftMap.set("floor-0", null);
  
    floorsContainer.style.visibility = "visible";
    floorsContainer.style.border = `2px solid var(--primary-color)`;
  }
  
  function renderLifts(totalLifts) {
    const groundFloor = document.querySelector("#floors-container>#floor-0");
    for (let liftNumber = 1; liftNumber <= totalLifts; liftNumber++) {
      const currentLift = document.createElement("section");
      currentLift.className = "lift";
      currentLift.id = `lift-${liftNumber}`;
      currentLift.innerHTML = `
              <section class="door left-door"></section>
              <section class="door right-door"></section>
          `;
      liftsAvailability.set(`lift-${liftNumber}`, true);
      liftAt.set(`lift-${liftNumber}`, 0);
      groundFloor.appendChild(currentLift);
    }
  }
  
  function checkPendingCalls(liftId) {
    if (pendingCalls.length > 0) {
      const nextFloorId = pendingCalls.shift();
      moveLift(nextFloorId, liftId);
    }
  }
  