var app = new Vue({
    el: '#vue-app',
    methods: {
        submitContact: function(e) {
            const self = this;
            this.errors = [];
            this.ok = false;
            hasErrors = false;
            
            if(!this.name) this.errors.push("Name is missing")
            if(!this.email) this.errors.push("Email is missing")
            if(!this.description) this.errors.push("Description is missing")

            if(this.errors.length == 0) {
                const message = {
                    name: this.name,
                    email: this.email,
                    description: this.description
                };
                fetch('https://bpiipnuxsj.execute-api.eu-west-1.amazonaws.com/v1/contact', {
                    method: 'POST',
                    body: JSON.stringify(message),
                    headers:{
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(response) { 
                    if(response.status === 200) { 
                        return Promise.resolve(response)
                    }else {
                        return Promise.reject(new Error("failed"))
                    }
                })
                .then(function(response) { return response.json()})
                .then(function(response)  {
                    self.ok = true;
                    self.name = '';
                    self.email = '';
                    self.description = '';
                }).catch(function(error) {
                    self.errors.push("a major error. I'm really sorry :(")
                });
            }
        }
    },
    data: {
        errors: [],
        name: '',
        email: '',
        description: '',
        ok: false
    }
})   