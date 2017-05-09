var facts = [
  "Ninjas don't sweat.",
  "Ninjas invented skateboarding.",
  "Ninjas never wear headbands with the word 'ninja' printed on them.",
  "Ninjas can breath underwater anytime they want.",
  "Ninjas can change clothes in less than 1 second.",
  "Ninjas always land on their feet.",
  "Ninjas invented the internet.",
  "Ninjas can crush golfballs with 2 fingers, any two fingers.",
  "Ninjas can remove their shadow if needed.",
  "Ninjas go anywhere they want instantly.",
  "Ninjas can run 100 miles on their hands.",
  "Ninjas train 20 hours/day starting from age 2.",
  "Ninjas are masters of disguise.",
  "Ninjas can hover for hours.",
  "Ninjas split planks vertically with their nose.",
  "Ninjas can hide in incense smoke.",
  "Ninjas are the best guitar players. Ever.",
  "Ninjas do NOT wear spandex.",
  "If you see a ninja, he is NOT a ninja."
]

function ninjaFact() {
  var random_index = Math.floor(Math.random() * facts.length);
  return facts[random_index];
}

function setNinjaFact() {
  fact = ninjaFact();
  document.getElementById('ninja-fact').innerHTML = fact;
}
