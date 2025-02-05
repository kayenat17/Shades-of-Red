function calculateOvulation() {
    var lastPeriodDate = new Date(document.getElementById("lastPeriod").value);
    var ovulationDate = new Date(lastPeriodDate.getTime() + 14 * 24 * 60 * 60 * 1000); // Assuming ovulation occurs around 14 days after the last period
    document.getElementById("ovulationDate").innerText = "Ovulation Date: " + ovulationDate.toDateString();
}

function trackMood() {
    var mood = document.getElementById("mood").value;
    var moodList = document.getElementById("moodList");
    var listItem = document.createElement("li");
    listItem.innerText = mood;
    moodList.appendChild(listItem);
}
