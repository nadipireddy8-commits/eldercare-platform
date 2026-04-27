fetch("http://localhost:5000/api/caregivers")
.then(r=>r.json())
.then(data=>{
  data.forEach(c=>{
    const div=document.createElement("div");
    div.className="card";

    div.innerHTML=`
      <h3>${c.name}</h3>
      <p>${c.service}</p>
      <button onclick="book('${c._id}')">Book</button>
    `;

    list.appendChild(div);
  });
});

function book(id){
  fetch("http://localhost:5000/api/bookings",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      caregiverId:id,
      userId:"demo",
      date:new Date()
    })
  }).then(()=>alert("Booked"));
}