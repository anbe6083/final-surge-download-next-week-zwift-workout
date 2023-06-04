function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

waitForElm(".main-list-group").then((elem) => {
  var newAnchor = document.createElement("a");
  newAnchor.href = "#";
  newAnchor.classList.add(
    "list-group-item",
    "list-group-item-action",
    "zwift-sync"
  );
  newAnchor.style.backgroundColor = "#FB6418";
  newAnchor.style.color = "#fff";
  var newDiv = document.createElement("div");
  newDiv.classList.add(
    "d-flex",
    "w-100",
    "justify-content-start",
    "align-items-center"
  );

  var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  newSvg.setAttribute("aria-hidden", "true");
  newSvg.classList.add("svg-icon", "menu-icon");
  newSvg.setAttribute("id", "svg-container");

  var newUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
  newUse.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "xlink:href",
    "#icon-download-file"
  );

  newSvg.appendChild(newUse);

  var newSpan = document.createElement("span");
  newSpan.classList.add("menu-collapsed");
  newSpan.textContent = "Download Zwift Workouts";

  newDiv.appendChild(newSvg);
  newDiv.appendChild(newSpan);
  newAnchor.appendChild(newDiv);
  elem.append(newAnchor);
});

waitForElm(".zwift-sync").then((elem) => {
  elem.addEventListener("click", (e) => {
    const workouts = getStructuredWorkouts();

    workouts.then((workouts) => {
      workouts.forEach((workout) => {
        getWorkoutDownload(workout.key, workout.name);
      });
    });
  });
});

async function getStructuredWorkouts() {
  const authToken = localStorage.getItem("auth-token");
  const userToken = localStorage.getItem("user-token");
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);
  const formattedEndDate = endDate.toISOString().split("T")[0];
  const url = `https://beta.finalsurge.com/api/WorkoutList?scope=USER&scopekey=${userToken}&startdate=${formattedToday}&enddate=${formattedEndDate}&ishistory=false&completedonly=false`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + authToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const structuredWorkouts = data.data.filter(
        (workout) => workout.has_structured_workout === true
      );
      return structuredWorkouts;
    } else {
      console.error("Request failed with status " + response.status);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

function getWorkoutDownload(workoutKey, workoutName) {
  const xhr = new XMLHttpRequest();
  const authToken = localStorage.getItem("auth-token");
  const userToken = localStorage.getItem("user-token");

  xhr.open(
    "GET",
    `https://beta.finalsurge.com/api/StructuredWorkoutDownload?scope=USER&scopekey=${userToken}&workout_key=${workoutKey}&Type=zwo&Output=file&SimpleName=true&target=power&user_key=${userToken}`,
    true
  );
  xhr.setRequestHeader("Authorization", "Bearer " + authToken);
  xhr.responseType = "blob";
  xhr.onload = function () {
    if (xhr.status === 200) {
      const file = new Blob([xhr.response], { type: "text/plain" });

      const a = document.createElement("a");
      const url = window.URL.createObjectURL(file);
      a.href = url;
      a.download = `${workoutName}.zwo`;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    } else {
      console.error("Request failed with status " + xhr.status);
    }
  };

  xhr.send();
}
